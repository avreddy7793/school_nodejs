const crypto = require('crypto');
const https = require('https');
const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const db = pool.promise();

const gatewaysTable = table('payment_gateways');
const ordersTable = table('payment_orders');
const transactionsTable = table('payment_transactions');
const feeRecordsTable = table('fee_records');
const feePaymentsTable = table('fee_payments');
const hostelAssignmentsTable = table('student_room_assignments');
const hostelRoomsTable = table('hostel_rooms');
const hostelPaymentsTable = table('hostel_payments');

const moduleTypes = new Set(['FEE', 'HOSTEL', 'ADMISSION', 'TRANSPORT']);
const gatewayNames = new Set(['RAZORPAY']);
let schemaReady = false;

function table(name) {
  return `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier(name)}`;
}

function escapeIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``;
}

function sendDatabaseError(res, error) {
  return res.status(500).json({
    success: false,
    message: 'Database error',
    error: error.message
  });
}

function normalizePositiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeMoney(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Number(parsed.toFixed(2)) : null;
}

function normalizeText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed || null;
}

function normalizeModuleType(value) {
  const normalized = String(value || '').trim().toUpperCase();
  return moduleTypes.has(normalized) ? normalized : null;
}

function normalizeGateway(value) {
  const normalized = String(value || 'RAZORPAY').trim().toUpperCase();
  return gatewayNames.has(normalized) ? normalized : 'RAZORPAY';
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function ensureSchema() {
  schemaReady = true;
}

async function getGatewayConfig(clientId, gatewayName = 'RAZORPAY') {
  const [rows] = await db.query(`
    SELECT *
    FROM ${gatewaysTable}
    WHERE client_id = ? AND gateway_name = ?
    LIMIT 1
  `, [clientId, gatewayName]);

  if (rows.length) {
    return rows[0];
  }

  const envKeyId = process.env.RAZORPAY_KEY_ID || null;
  const envKeySecret = process.env.RAZORPAY_KEY_SECRET || null;
  return {
    client_id: clientId,
    gateway_name: gatewayName,
    key_id: envKeyId,
    key_secret: envKeySecret,
    webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET || null,
    is_active: envKeyId && envKeySecret ? 1 : 0
  };
}

async function getPublicConfig(req, res) {
  try {
    await ensureSchema();
    const clientId = normalizePositiveInteger(req.query.client_id);
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Client is required.' });
    }

    const config = await getGatewayConfig(clientId);
    return res.status(200).json({
      success: true,
      data: {
        gateway_name: 'RAZORPAY',
        key_id: config.key_id || '',
        is_active: Boolean(Number(config.is_active) && config.key_id)
      }
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function saveGatewayConfig(req, res) {
  try {
    await ensureSchema();
    const clientId = normalizePositiveInteger(req.body.clientId || req.body.client_id);
    const gatewayName = normalizeGateway(req.body.gatewayName || req.body.gateway_name);
    const keyId = normalizeText(req.body.keyId || req.body.key_id);
    let keySecret = normalizeText(req.body.keySecret || req.body.key_secret);
    const webhookSecret = normalizeText(req.body.webhookSecret || req.body.webhook_secret);
    const isActive = req.body.isActive === undefined ? 1 : Number(Boolean(req.body.isActive));

    if (!clientId || !keyId) {
      return res.status(400).json({ success: false, message: 'Client and key id are required.' });
    }

    if (!keySecret) {
      const existing = await getGatewayConfig(clientId, gatewayName);
      keySecret = existing.key_secret || null;
    }

    if (!keySecret) {
      return res.status(400).json({ success: false, message: 'Razorpay key secret is required the first time.' });
    }

    await db.query(`
      INSERT INTO ${gatewaysTable} (client_id, gateway_name, key_id, key_secret, webhook_secret, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        key_id = VALUES(key_id),
        key_secret = VALUES(key_secret),
        webhook_secret = VALUES(webhook_secret),
        is_active = VALUES(is_active)
    `, [clientId, gatewayName, keyId, keySecret, webhookSecret, isActive]);

    return res.status(200).json({ success: true, message: 'Payment gateway settings saved successfully.' });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

function razorpayRequest(config, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const auth = Buffer.from(`${config.key_id}:${config.key_secret}`).toString('base64');
    const request = https.request({
      hostname: 'api.razorpay.com',
      path: '/v1/orders',
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        const parsed = data ? JSON.parse(data) : {};
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(parsed);
          return;
        }

        reject(new Error(parsed.error?.description || parsed.error?.reason || 'Unable to create Razorpay order.'));
      });
    });

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

async function validatePayableAmount(clientId, moduleType, recordId, amount) {
  if (moduleType === 'FEE' || moduleType === 'ADMISSION') {
    const [rows] = await db.query(`
      SELECT fee_id, student_id, due_balance
      FROM ${feeRecordsTable}
      WHERE client_id = ? AND fee_id = ?
      LIMIT 1
    `, [clientId, recordId]);

    if (!rows.length) {
      return { error: 'Fee record not found.' };
    }

    const due = Number(rows[0].due_balance || 0);
    if (amount > due) {
      return { error: 'Payment amount cannot be greater than fee due.' };
    }

    return { student_id: rows[0].student_id, due };
  }

  if (moduleType === 'HOSTEL') {
    const [rows] = await db.query(`
      SELECT
        sra.assignment_id,
        sra.student_id,
        sra.room_id,
        CAST(hr.fee AS DECIMAL(10,2)) AS fee,
        COALESCE(SUM(hp.amount), 0) AS total_paid
      FROM ${hostelAssignmentsTable} sra
      INNER JOIN ${hostelRoomsTable} hr ON hr.room_id = sra.room_id
      LEFT JOIN ${hostelPaymentsTable} hp ON hp.assignment_id = sra.assignment_id
      WHERE sra.client_id = ? AND sra.assignment_id = ?
      GROUP BY sra.assignment_id, sra.student_id, sra.room_id, hr.fee
      LIMIT 1
    `, [clientId, recordId]);

    if (!rows.length) {
      return { error: 'Hostel assignment not found.' };
    }

    const due = Math.max(Number(rows[0].fee || 0) - Number(rows[0].total_paid || 0), 0);
    if (amount > due) {
      return { error: 'Payment amount cannot be greater than hostel due.' };
    }

    return { student_id: rows[0].student_id, room_id: rows[0].room_id, due };
  }

  return { error: 'Unsupported payment module.' };
}

async function createOrder(req, res) {
  try {
    await ensureSchema();
    const clientId = normalizePositiveInteger(req.body.clientId || req.body.client_id);
    const moduleType = normalizeModuleType(req.body.moduleType || req.body.module_type);
    const recordId = normalizePositiveInteger(req.body.recordId || req.body.record_id);
    const amount = normalizeMoney(req.body.amount);
    const gatewayName = normalizeGateway(req.body.gatewayName || req.body.gateway_name);

    if (!clientId || !moduleType || !recordId || !amount) {
      return res.status(400).json({ success: false, message: 'Client, module, record, and amount are required.' });
    }

    const payable = await validatePayableAmount(clientId, moduleType, recordId, amount);
    if (payable.error) {
      return res.status(400).json({ success: false, message: payable.error });
    }

    const config = await getGatewayConfig(clientId, gatewayName);
    if (!Number(config.is_active) || !config.key_id || !config.key_secret) {
      return res.status(400).json({ success: false, message: 'Payment gateway is not configured.' });
    }

    const receiptNo = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const gatewayOrder = await razorpayRequest(config, {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: receiptNo,
      notes: {
        module_type: moduleType,
        record_id: String(recordId),
        client_id: String(clientId)
      }
    });

    const [result] = await db.query(`
      INSERT INTO ${ordersTable}
        (client_id, student_id, module_type, record_id, gateway_name, gateway_order_id, receipt_no, amount, currency, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'INR', 'CREATED', ?)
    `, [
      clientId,
      payable.student_id || null,
      moduleType,
      recordId,
      gatewayName,
      gatewayOrder.id,
      receiptNo,
      amount,
      normalizeText(req.body.notes)
    ]);

    return res.status(201).json({
      success: true,
      data: {
        payment_order_id: result.insertId,
        key_id: config.key_id,
        gateway_name: gatewayName,
        gateway_order_id: gatewayOrder.id,
        amount,
        currency: 'INR',
        receipt_no: receiptNo
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Unable to create payment order.' });
  }
}

function verifyRazorpaySignature(orderId, paymentId, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const actual = String(signature || '');
  return actual.length === expected.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

async function applyFeePayment(connection, order, paymentId) {
  const [[fee]] = await connection.query(`
    SELECT *
    FROM ${feeRecordsTable}
    WHERE fee_id = ?
    FOR UPDATE
  `, [order.record_id]);

  if (!fee) {
    throw new Error('Fee record not found.');
  }

  const nextDeposit = Number((Number(fee.deposit || 0) + Number(order.amount)).toFixed(2));
  const nextDue = Math.max(Number(fee.total || 0) - nextDeposit, 0);
  await connection.query(`
    UPDATE ${feeRecordsTable}
    SET deposit = ?, due_balance = ?
    WHERE fee_id = ?
  `, [nextDeposit, nextDue, fee.fee_id]);

  const [result] = await connection.query(`
    INSERT INTO ${feePaymentsTable}
      (client_id, fee_id, receipt_no, payment_date, payment_type, payment_mode, amount, total_paid_after, due_balance_after, notes)
    VALUES (?, ?, ?, ?, ?, 'Razorpay', ?, ?, ?, ?)
  `, [
    order.client_id,
    fee.fee_id,
    `RZP-${paymentId.slice(-12)}`,
    today(),
    nextDue <= 0 ? 'FULL' : 'PARTIAL',
    order.amount,
    nextDeposit,
    nextDue,
    `Gateway payment ${paymentId}`
  ]);

  return result.insertId;
}

async function applyHostelPayment(connection, order, paymentId) {
  const [[assignment]] = await connection.query(`
    SELECT sra.assignment_id, sra.student_id, sra.room_id
    FROM ${hostelAssignmentsTable} sra
    WHERE sra.assignment_id = ?
    FOR UPDATE
  `, [order.record_id]);

  if (!assignment) {
    throw new Error('Hostel assignment not found.');
  }

  const [result] = await connection.query(`
    INSERT INTO ${hostelPaymentsTable}
      (client_id, assignment_id, student_id, room_id, receipt_no, payment_date, payment_type, payment_mode, amount, notes)
    VALUES (?, ?, ?, ?, ?, ?, 'PARTIAL', 'Razorpay', ?, ?)
  `, [
    order.client_id,
    assignment.assignment_id,
    assignment.student_id,
    assignment.room_id,
    `HSTRZP${paymentId.slice(-12)}`,
    today(),
    order.amount,
    `Gateway payment ${paymentId}`
  ]);

  return result.insertId;
}

async function verifyPayment(req, res) {
  let connection;
  try {
    await ensureSchema();
    const gatewayOrderId = normalizeText(req.body.razorpay_order_id || req.body.gateway_order_id);
    const gatewayPaymentId = normalizeText(req.body.razorpay_payment_id || req.body.gateway_payment_id);
    const signature = normalizeText(req.body.razorpay_signature || req.body.gateway_signature);

    if (!gatewayOrderId || !gatewayPaymentId || !signature) {
      return res.status(400).json({ success: false, message: 'Payment verification details are required.' });
    }

    const [orders] = await db.query(`
      SELECT *
      FROM ${ordersTable}
      WHERE gateway_order_id = ?
      LIMIT 1
    `, [gatewayOrderId]);

    if (!orders.length) {
      return res.status(404).json({ success: false, message: 'Payment order not found.' });
    }

    const order = orders[0];
    if (order.status === 'PAID') {
      return res.status(200).json({ success: true, message: 'Payment already verified.' });
    }

    const config = await getGatewayConfig(order.client_id, order.gateway_name);
    if (!verifyRazorpaySignature(gatewayOrderId, gatewayPaymentId, signature, config.key_secret)) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    if (order.module_type === 'FEE' || order.module_type === 'ADMISSION') {
      await applyFeePayment(connection, order, gatewayPaymentId);
    } else if (order.module_type === 'HOSTEL') {
      await applyHostelPayment(connection, order, gatewayPaymentId);
    } else {
      throw new Error('Unsupported payment module.');
    }

    await connection.query(`
      INSERT INTO ${transactionsTable}
        (payment_order_id, client_id, gateway_name, gateway_order_id, gateway_payment_id, gateway_signature, amount, currency, status, raw_response)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PAID', ?)
    `, [
      order.payment_order_id,
      order.client_id,
      order.gateway_name,
      gatewayOrderId,
      gatewayPaymentId,
      signature,
      order.amount,
      order.currency,
      JSON.stringify(req.body)
    ]);

    await connection.query(`UPDATE ${ordersTable} SET status = 'PAID' WHERE payment_order_id = ?`, [order.payment_order_id]);
    await connection.commit();

    return res.status(200).json({ success: true, message: 'Payment verified successfully.' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    return res.status(500).json({ success: false, message: error.message || 'Unable to verify payment.' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = {
  getPublicConfig,
  saveGatewayConfig,
  createOrder,
  verifyPayment
};
