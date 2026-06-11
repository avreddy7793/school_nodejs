const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || process.env.DB_DATABASE || 'school';
const feesTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('fee_records')}`;
const feePaymentsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('fee_payments')}`;
const studentsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('students')}`;
const classroomsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('classrooms')}`;
const clientMasterTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('client_master')}`;
let feePaymentSchemaReady = null;
let feeRecordSchemaReady = null;

const feeColumns = [
  'monthly_fee',
  'admission_fee',
  'registration_fee',
  'art_material',
  'transport',
  'hostel_fee',
  'books',
  'uniform',
  'fine',
  'others',
  'previous_balance'
];

const selectableColumns = `
  fr.fee_id,
  fr.client_id,
  fr.fee_reg_no,
  fr.student_id,
  CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
  s.admission_number,
  s.yearly_fee,
  fr.classroom_id,
  c.name AS classroom_name,
  fr.fee_year,
  fr.monthly_fee,
  fr.admission_fee,
  fr.registration_fee,
  fr.art_material,
  fr.transport,
  fr.hostel_fee,
  fr.books,
  fr.uniform,
  fr.fine,
  fr.others,
  fr.previous_balance,
  fr.discount,
  fr.total,
  fr.deposit,
  fr.due_balance
`;

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

function queryAsync(sql, values = []) {
  return pool.promise().query(sql, values);
}

function getValue(body, camelKey, snakeKey = camelKey, fallback = undefined) {
  if (body[camelKey] !== undefined) {
    return body[camelKey];
  }

  if (body[snakeKey] !== undefined) {
    return body[snakeKey];
  }

  return fallback;
}

function normalizePositiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeMoney(value, fallback = 0) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Number(parsed.toFixed(2)) : null;
}

function normalizeText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed || null;
}

function normalizePaymentType(value) {
  const normalized = String(value || 'PARTIAL').trim().toUpperCase();
  const allowed = new Set(['MONTHLY', 'QUARTERLY', 'FULL', 'OTHERS', 'PARTIAL']);
  return allowed.has(normalized) ? normalized : 'PARTIAL';
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function ensureFeePaymentSchema() {
  if (!feePaymentSchemaReady) {
    feePaymentSchemaReady = (async () => {
      await queryAsync(`
        CREATE TABLE IF NOT EXISTS ${feePaymentsTable} (
          payment_id INT NOT NULL AUTO_INCREMENT,
          client_id BIGINT DEFAULT NULL,
          fee_id INT NOT NULL,
          receipt_no VARCHAR(40) DEFAULT NULL,
          payment_date DATE NOT NULL,
          payment_type VARCHAR(20) DEFAULT 'PARTIAL',
          payment_mode VARCHAR(30) DEFAULT 'Cash',
          amount DECIMAL(10,2) NOT NULL,
          total_paid_after DECIMAL(10,2) DEFAULT NULL,
          due_balance_after DECIMAL(10,2) DEFAULT NULL,
          notes TEXT DEFAULT NULL,
          created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (payment_id),
          UNIQUE KEY uq_fee_payment_receipt (receipt_no),
          KEY idx_fee_payments_client (client_id),
          KEY idx_fee_payments_fee (fee_id),
          CONSTRAINT fk_fee_payments_fee FOREIGN KEY (fee_id) REFERENCES ${feesTable} (fee_id) ON DELETE CASCADE,
          CONSTRAINT fk_fee_payments_client FOREIGN KEY (client_id) REFERENCES ${clientMasterTable} (client_id)
        )
      `);
    })();
  }

  return feePaymentSchemaReady;
}

async function ensureFeeRecordSchema() {
  if (!feeRecordSchemaReady) {
    feeRecordSchemaReady = (async () => {
      const [columns] = await queryAsync(`SHOW COLUMNS FROM ${feesTable} LIKE 'hostel_fee'`);
      if (!columns.length) {
        await queryAsync(`ALTER TABLE ${feesTable} ADD COLUMN hostel_fee DECIMAL(10,2) DEFAULT NULL AFTER transport`);
      }
    })();
  }

  return feeRecordSchemaReady;
}

async function ensureFeeSchema() {
  await ensureFeeRecordSchema();
  await ensureFeePaymentSchema();
}

function buildFeePayload(body) {
  const payload = {
    client_id: normalizePositiveInteger(getValue(body, 'clientId', 'client_id')),
    fee_reg_no: normalizeText(getValue(body, 'feeRegNo', 'fee_reg_no')),
    student_id: normalizePositiveInteger(getValue(body, 'studentId', 'student_id')),
    classroom_id: normalizePositiveInteger(getValue(body, 'classroomId', 'classroom_id')),
    fee_year: normalizeText(getValue(body, 'feeYear', 'fee_year')),
    discount: normalizeMoney(getValue(body, 'discount'), 0),
    deposit: normalizeMoney(getValue(body, 'deposit'), 0)
  };

  feeColumns.forEach((column) => {
    const camelKey = column.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    payload[column] = normalizeMoney(getValue(body, camelKey, column), 0);
  });

  const invalidMoneyField = [...feeColumns, 'discount', 'deposit'].find((column) => payload[column] === null);
  if (invalidMoneyField) {
    payload.invalid_money_field = invalidMoneyField;
    return payload;
  }

  applyTotals(payload);
  return payload;
}

function buildFeeUpdatePayload(body) {
  const payload = {};
  const fieldMap = {
    clientId: 'client_id',
    feeRegNo: 'fee_reg_no',
    studentId: 'student_id',
    classroomId: 'classroom_id',
    feeYear: 'fee_year',
    monthlyFee: 'monthly_fee',
    admissionFee: 'admission_fee',
    registrationFee: 'registration_fee',
    artMaterial: 'art_material',
    transport: 'transport',
    hostelFee: 'hostel_fee',
    books: 'books',
    uniform: 'uniform',
    fine: 'fine',
    others: 'others',
    previousBalance: 'previous_balance',
    discount: 'discount',
    deposit: 'deposit'
  };

  Object.entries(fieldMap).forEach(([camelKey, column]) => {
    if (body[camelKey] === undefined && body[column] === undefined) {
      return;
    }

    const rawValue = getValue(body, camelKey, column);

    if (['client_id', 'student_id', 'classroom_id'].includes(column)) {
      payload[column] = normalizePositiveInteger(rawValue);
      return;
    }

    if (['fee_reg_no', 'fee_year'].includes(column)) {
      payload[column] = normalizeText(rawValue);
      return;
    }

    payload[column] = normalizeMoney(rawValue, 0);
  });

  return payload;
}

function applyTotals(payload) {
  const subtotal = feeColumns.reduce((sum, column) => sum + Number(payload[column] || 0), 0);
  const total = Math.max(subtotal - Number(payload.discount || 0), 0);
  const dueBalance = Math.max(total - Number(payload.deposit || 0), 0);

  payload.total = Number(total.toFixed(2));
  payload.due_balance = Number(dueBalance.toFixed(2));
}

async function insertFeePayment(connection, feeRecord, amount, options = {}) {
  const paymentAmount = normalizeMoney(amount, 0);
  if (!paymentAmount || paymentAmount <= 0) {
    return null;
  }

  const paymentDate = normalizeText(getValue(options, 'paymentDate', 'payment_date')) || today();
  const paymentType = normalizePaymentType(getValue(options, 'paymentType', 'payment_type', getValue(options, 'feeMode', 'fee_mode')));
  const paymentMode = normalizeText(getValue(options, 'paymentMode', 'payment_mode')) || 'Cash';
  const notes = normalizeText(getValue(options, 'paymentNotes', 'payment_notes', getValue(options, 'notes')));
  const payload = {
    client_id: feeRecord.client_id,
    fee_id: feeRecord.fee_id,
    receipt_no: null,
    payment_date: paymentDate,
    payment_type: paymentType,
    payment_mode: paymentMode,
    amount: paymentAmount,
    total_paid_after: normalizeMoney(feeRecord.deposit, 0),
    due_balance_after: normalizeMoney(feeRecord.due_balance, 0),
    notes
  };

  const [result] = await connection.query(`INSERT INTO ${feePaymentsTable} SET ?`, payload);
  const receiptNo = `${feeRecord.fee_reg_no}-PAY${String(result.insertId).padStart(4, '0')}`;
  await connection.query(`UPDATE ${feePaymentsTable} SET receipt_no = ? WHERE payment_id = ?`, [receiptNo, result.insertId]);

  return {
    payment_id: result.insertId,
    fee_id: feeRecord.fee_id,
    receipt_no: receiptNo,
    payment_date: paymentDate,
    payment_type: paymentType,
    payment_mode: paymentMode,
    amount: paymentAmount,
    total_paid_after: payload.total_paid_after,
    due_balance_after: payload.due_balance_after,
    notes
  };
}

function getNextFeeRegNo(callback) {
  pool.query(`SELECT fee_reg_no FROM ${feesTable}`, (error, results) => {
    if (error) {
      callback(error);
      return;
    }

    const maxNumber = results.reduce((max, row) => {
      const match = String(row.fee_reg_no || '').match(/(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);

    callback(null, `FEE${String(maxNumber + 1).padStart(4, '0')}`);
  });
}

async function getFeeRecords(req, res) {
  try {
    await ensureFeeRecordSchema();
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const { client_id, classroom_id, student_id, fee_year, status } = req.query;
  const conditions = [];
  const values = [];

  if (client_id) {
    conditions.push('fr.client_id = ?');
    values.push(client_id);
  }

  if (classroom_id) {
    conditions.push('fr.classroom_id = ?');
    values.push(classroom_id);
  }

  if (student_id) {
    conditions.push('fr.student_id = ?');
    values.push(student_id);
  }

  if (fee_year) {
    conditions.push('fr.fee_year = ?');
    values.push(fee_year);
  }

  if (status === 'paid') {
    conditions.push('COALESCE(fr.due_balance, 0) <= 0');
  }

  if (status === 'due') {
    conditions.push('COALESCE(fr.due_balance, 0) > 0');
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT ${selectableColumns}
    FROM ${feesTable} fr
    INNER JOIN ${studentsTable} s ON s.student_id = fr.student_id
    INNER JOIN ${classroomsTable} c ON c.classroom_id = fr.classroom_id
    ${whereClause}
    ORDER BY fr.fee_id DESC
  `;

  pool.query(sql, values, (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    return res.status(200).json({
      success: true,
      data: results
    });
  });
}

async function getFeeRecordById(req, res) {
  try {
    await ensureFeeRecordSchema();
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const clientId = req.query.client_id;
  const sql = `
    SELECT ${selectableColumns}
    FROM ${feesTable} fr
    INNER JOIN ${studentsTable} s ON s.student_id = fr.student_id
    INNER JOIN ${classroomsTable} c ON c.classroom_id = fr.classroom_id
    WHERE fr.fee_id = ? AND (? IS NULL OR fr.client_id = ?)
  `;

  pool.query(sql, [req.params.feeId, clientId || null, clientId || null], (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: results[0]
    });
  });
}

async function getAllFeePayments(req, res) {
  try {
    await ensureFeeSchema();
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const { client_id, payment_date, date_from, date_to } = req.query;
  const conditions = [];
  const values = [];

  if (client_id) {
    conditions.push('(fp.client_id = ? OR fr.client_id = ?)');
    values.push(client_id, client_id);
  }

  if (payment_date) {
    conditions.push('fp.payment_date = ?');
    values.push(payment_date);
  }

  if (date_from) {
    conditions.push('fp.payment_date >= ?');
    values.push(date_from);
  }

  if (date_to) {
    conditions.push('fp.payment_date <= ?');
    values.push(date_to);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT
      fp.payment_id,
      fp.client_id,
      fp.fee_id,
      fr.fee_reg_no,
      fr.student_id,
      CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
      s.admission_number,
      fr.classroom_id,
      c.name AS classroom_name,
      fr.fee_year,
      fp.receipt_no,
      fp.payment_date,
      fp.payment_type,
      fp.payment_mode,
      fp.amount,
      fp.total_paid_after,
      fp.due_balance_after,
      fp.notes,
      fp.created_at
    FROM ${feePaymentsTable} fp
    INNER JOIN ${feesTable} fr ON fr.fee_id = fp.fee_id
    INNER JOIN ${studentsTable} s ON s.student_id = fr.student_id
    INNER JOIN ${classroomsTable} c ON c.classroom_id = fr.classroom_id
    ${whereClause}
    ORDER BY fp.payment_date DESC, fp.payment_id DESC
  `;

  pool.query(sql, values, (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    return res.status(200).json({
      success: true,
      data: results
    });
  });
}

async function createFeeRecord(req, res) {
  try {
    await ensureFeeSchema();
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const payload = buildFeePayload(req.body);

  if (!payload.client_id || !payload.student_id || !payload.classroom_id || !payload.fee_year) {
    return res.status(400).json({
      success: false,
      message: 'Client, student, class, and fee year are required'
    });
  }

  if (payload.invalid_money_field) {
    return res.status(400).json({
      success: false,
      message: 'Fee amounts must be valid non-negative numbers'
    });
  }

  const insertFeeRecord = async () => {
    let connection;
    try {
      connection = await pool.promise().getConnection();
      await connection.beginTransaction();

      const studentSql = `
        SELECT student_id
        FROM ${studentsTable}
        WHERE student_id = ?
          AND (? IS NULL OR client_id = ?)
          AND class_name = ?
      `;

      const [students] = await connection.query(studentSql, [payload.student_id, payload.client_id, payload.client_id, payload.classroom_id]);

      if (!students.length) {
        await connection.rollback();
        return res.status(400).json({
          success: false,
          message: 'Choose a valid student from the selected class'
        });
      }

      const [result] = await connection.query(`INSERT INTO ${feesTable} SET ?`, payload);
      const feeRecord = {
        ...payload,
        fee_id: result.insertId
      };
      const payment = await insertFeePayment(connection, feeRecord, payload.deposit, req.body);

      await connection.commit();

      return res.status(201).json({
        success: true,
        message: 'Fee record saved successfully',
        fee_id: result.insertId,
        fee_reg_no: payload.fee_reg_no,
        payment
      });
    } catch (error) {
      if (connection) {
        await connection.rollback();
      }

      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'Fee record already exists for this student and year'
        });
      }

      return sendDatabaseError(res, error);
    } finally {
      if (connection) {
        connection.release();
      }
    }
  };

  if (payload.fee_reg_no) {
    insertFeeRecord();
    return;
  }

  getNextFeeRegNo((error, feeRegNo) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    payload.fee_reg_no = feeRegNo;
    insertFeeRecord();
  });
}

async function updateFeeRecord(req, res) {
  try {
    await ensureFeeSchema();
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const payload = buildFeeUpdatePayload(req.body);

  if (!Object.keys(payload).length) {
    return res.status(400).json({
      success: false,
      message: 'No updatable fields were provided'
    });
  }

  if (Object.values(payload).some((value) => value === null)) {
    return res.status(400).json({
      success: false,
      message: 'Update values must be valid'
    });
  }

  let connection;
  try {
    connection = await pool.promise().getConnection();
    await connection.beginTransaction();

    const currentSql = `SELECT * FROM ${feesTable} WHERE fee_id = ? FOR UPDATE`;
    const [records] = await connection.query(currentSql, [req.params.feeId]);

    if (!records.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    const mergedPayload = { ...records[0], ...payload };
    applyTotals(mergedPayload);
    payload.total = mergedPayload.total;
    payload.due_balance = mergedPayload.due_balance;
    const previousDeposit = Number(records[0].deposit || 0);
    const nextDeposit = Number(mergedPayload.deposit || 0);
    const paymentAmount = payload.deposit !== undefined ? Number((nextDeposit - previousDeposit).toFixed(2)) : 0;

    await connection.query(`UPDATE ${feesTable} SET ? WHERE fee_id = ?`, [payload, req.params.feeId]);
    const payment = await insertFeePayment(connection, {
      ...mergedPayload,
      fee_id: Number(req.params.feeId)
    }, paymentAmount, req.body);

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Fee record updated successfully',
      payment
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Fee record already exists for this student and year'
      });
    }

    return sendDatabaseError(res, error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

async function getFeePayments(req, res) {
  try {
    await ensureFeeSchema();
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const clientId = req.query.client_id;
  const sql = `
    SELECT
      fp.payment_id,
      fp.client_id,
      fp.fee_id,
      fp.receipt_no,
      fp.payment_date,
      fp.payment_type,
      fp.payment_mode,
      fp.amount,
      fp.total_paid_after,
      fp.due_balance_after,
      fp.notes,
      fp.created_at
    FROM ${feePaymentsTable} fp
    INNER JOIN ${feesTable} fr ON fr.fee_id = fp.fee_id
    WHERE fp.fee_id = ? AND (? IS NULL OR fp.client_id = ? OR fr.client_id = ?)
    ORDER BY fp.payment_date DESC, fp.payment_id DESC
  `;

  pool.query(sql, [req.params.feeId, clientId || null, clientId || null, clientId || null], (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    return res.status(200).json({
      success: true,
      data: results
    });
  });
}

function deleteFeeRecord(req, res) {
  pool.query(`DELETE FROM ${feesTable} WHERE fee_id = ?`, [req.params.feeId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Fee record deleted successfully'
    });
  });
}

module.exports = {
  getFeeRecords,
  getFeeRecordById,
  getAllFeePayments,
  getFeePayments,
  createFeeRecord,
  updateFeeRecord,
  deleteFeeRecord
};
