const https = require('https');
const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || process.env.DB_DATABASE || 'school';
const db = pool.promise();

const configTable = table('whatsapp_settings');
const messagesTable = table('whatsapp_messages');
const studentsTable = table('students');
const clientMasterTable = table('client_master');

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

function normalizeText(value, fallback = null) {
  if (value === undefined || value === null) {
    return fallback;
  }

  const trimmed = String(value).trim();
  return trimmed || fallback;
}

function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return ['1', 'true', 'yes', 'active', 'enabled', 'on'].includes(String(value).trim().toLowerCase());
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits : '';
}

function getValue(body, camelKey, snakeKey = camelKey) {
  if (body[camelKey] !== undefined) {
    return body[camelKey];
  }

  return body[snakeKey];
}

async function ensureSchema() {
  if (schemaReady) {
    return;
  }

  schemaReady = true;
}

async function loadConfig(clientId) {
  await ensureSchema();
  const [rows] = await db.query(`SELECT * FROM ${configTable} WHERE client_id = ? LIMIT 1`, [clientId]);
  const row = rows[0] || {};

  return {
    client_id: clientId,
    phone_number_id: row.phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    business_account_id: row.business_account_id || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    access_token: row.access_token || process.env.WHATSAPP_ACCESS_TOKEN || '',
    default_language: row.default_language || process.env.WHATSAPP_DEFAULT_LANGUAGE || 'en',
    attendance_template_name: row.attendance_template_name || process.env.WHATSAPP_ATTENDANCE_TEMPLATE || '',
    fee_template_name: row.fee_template_name || '',
    exam_template_name: row.exam_template_name || '',
    holiday_template_name: row.holiday_template_name || '',
    send_attendance_absent: row.send_attendance_absent === undefined ? 1 : Number(row.send_attendance_absent),
    send_attendance_present: row.send_attendance_present === undefined ? 0 : Number(row.send_attendance_present),
    is_active: row.is_active === undefined ? normalizeBoolean(process.env.WHATSAPP_ACTIVE, false) : Boolean(Number(row.is_active)),
    access_token_present: Boolean(row.access_token || process.env.WHATSAPP_ACCESS_TOKEN)
  };
}

function publicConfig(config) {
  return {
    client_id: config.client_id,
    phone_number_id: config.phone_number_id,
    business_account_id: config.business_account_id,
    default_language: config.default_language,
    attendance_template_name: config.attendance_template_name,
    fee_template_name: config.fee_template_name,
    exam_template_name: config.exam_template_name,
    holiday_template_name: config.holiday_template_name,
    send_attendance_absent: Boolean(config.send_attendance_absent),
    send_attendance_present: Boolean(config.send_attendance_present),
    is_active: Boolean(config.is_active),
    access_token_present: Boolean(config.access_token_present)
  };
}

async function getConfig(req, res) {
  try {
    const clientId = normalizePositiveInteger(req.query.client_id || req.decoded?.client_id);
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Client id is required' });
    }

    const config = await loadConfig(clientId);
    return res.status(200).json({ success: true, data: publicConfig(config) });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function updateConfig(req, res) {
  try {
    await ensureSchema();
    const clientId = normalizePositiveInteger(getValue(req.body, 'clientId', 'client_id') || req.query.client_id || req.decoded?.client_id);
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Client id is required' });
    }

    const existing = await loadConfig(clientId);
    const payload = {
      client_id: clientId,
      phone_number_id: normalizeText(getValue(req.body, 'phoneNumberId', 'phone_number_id')),
      business_account_id: normalizeText(getValue(req.body, 'businessAccountId', 'business_account_id')),
      access_token: normalizeText(getValue(req.body, 'accessToken', 'access_token')) || existing.access_token || null,
      default_language: normalizeText(getValue(req.body, 'defaultLanguage', 'default_language'), 'en'),
      attendance_template_name: normalizeText(getValue(req.body, 'attendanceTemplateName', 'attendance_template_name')),
      fee_template_name: normalizeText(getValue(req.body, 'feeTemplateName', 'fee_template_name')),
      exam_template_name: normalizeText(getValue(req.body, 'examTemplateName', 'exam_template_name')),
      holiday_template_name: normalizeText(getValue(req.body, 'holidayTemplateName', 'holiday_template_name')),
      send_attendance_absent: normalizeBoolean(getValue(req.body, 'sendAttendanceAbsent', 'send_attendance_absent'), true) ? 1 : 0,
      send_attendance_present: normalizeBoolean(getValue(req.body, 'sendAttendancePresent', 'send_attendance_present'), false) ? 1 : 0,
      is_active: normalizeBoolean(getValue(req.body, 'isActive', 'is_active'), false) ? 1 : 0
    };

    await db.query(`
      INSERT INTO ${configTable} SET ?
      ON DUPLICATE KEY UPDATE
        phone_number_id = VALUES(phone_number_id),
        business_account_id = VALUES(business_account_id),
        access_token = VALUES(access_token),
        default_language = VALUES(default_language),
        attendance_template_name = VALUES(attendance_template_name),
        fee_template_name = VALUES(fee_template_name),
        exam_template_name = VALUES(exam_template_name),
        holiday_template_name = VALUES(holiday_template_name),
        send_attendance_absent = VALUES(send_attendance_absent),
        send_attendance_present = VALUES(send_attendance_present),
        is_active = VALUES(is_active),
        updated_at = CURRENT_TIMESTAMP
    `, [payload]);

    const config = await loadConfig(clientId);
    return res.status(200).json({
      success: true,
      message: 'WhatsApp settings saved successfully',
      data: publicConfig(config)
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

function buildTemplatePayload(to, templateName, language, values) {
  return {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: language || 'en' },
      components: [
        {
          type: 'body',
          parameters: values.map((value) => ({
            type: 'text',
            text: String(value || '-')
          }))
        }
      ]
    }
  };
}

function buildTextPayload(to, body) {
  return {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: {
      preview_url: false,
      body
    }
  };
}

function postToWhatsApp(config, payload) {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify(payload);
    const options = {
      hostname: 'graph.facebook.com',
      path: `/v19.0/${encodeURIComponent(config.phone_number_id)}/messages`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.access_token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        let parsed = {};
        try {
          parsed = data ? JSON.parse(data) : {};
        } catch (error) {
          return reject(error);
        }

        if (response.statusCode < 200 || response.statusCode >= 300) {
          const error = new Error(parsed.error?.message || 'WhatsApp message failed');
          error.provider = parsed;
          error.statusCode = response.statusCode;
          return reject(error);
        }

        return resolve(parsed);
      });
    });

    request.on('error', reject);
    request.write(requestBody);
    request.end();
  });
}

async function logMessage(row) {
  await ensureSchema();
  const [result] = await db.query(`INSERT INTO ${messagesTable} SET ?`, [row]);
  return result.insertId;
}

async function updateMessageLog(messageId, updates) {
  await db.query(`UPDATE ${messagesTable} SET ? WHERE message_id = ?`, [updates, messageId]);
}

async function sendMessage(options) {
  const clientId = normalizePositiveInteger(options.clientId || options.client_id);
  const recipientPhone = normalizePhone(options.to || options.recipientPhone || options.recipient_phone);
  if (!clientId || !recipientPhone) {
    return { success: false, skipped: true, message: 'Client and recipient phone are required' };
  }

  const config = await loadConfig(clientId);
  const body = normalizeText(options.body, '');
  const templateName = normalizeText(options.templateName || options.template_name);
  const moduleName = normalizeText(options.moduleName || options.module_name, 'GENERAL');
  const eventName = normalizeText(options.eventName || options.event_name, 'MANUAL');
  const values = Array.isArray(options.templateValues || options.template_values) ? options.templateValues || options.template_values : [];

  const messageId = await logMessage({
    client_id: clientId,
    module_name: moduleName,
    event_name: eventName,
    recipient_type: normalizeText(options.recipientType || options.recipient_type, 'PARENT'),
    recipient_phone: recipientPhone,
    recipient_name: normalizeText(options.recipientName || options.recipient_name),
    student_id: normalizePositiveInteger(options.studentId || options.student_id),
    template_name: templateName,
    message_body: body,
    status: 'QUEUED'
  });

  if (!config.is_active) {
    await updateMessageLog(messageId, { status: 'SKIPPED', error_message: 'WhatsApp is inactive' });
    return { success: false, skipped: true, message: 'WhatsApp is inactive' };
  }

  if (!config.phone_number_id || !config.access_token) {
    await updateMessageLog(messageId, { status: 'FAILED', error_message: 'WhatsApp credentials are missing' });
    return { success: false, message: 'WhatsApp credentials are missing' };
  }

  try {
    const payload = templateName
      ? buildTemplatePayload(recipientPhone, templateName, config.default_language, values)
      : buildTextPayload(recipientPhone, body);
    const response = await postToWhatsApp(config, payload);
    const providerMessageId = response.messages?.[0]?.id || null;
    await updateMessageLog(messageId, {
      status: 'SENT',
      provider_message_id: providerMessageId,
      sent_at: new Date()
    });
    return { success: true, provider_message_id: providerMessageId };
  } catch (error) {
    await updateMessageLog(messageId, {
      status: 'FAILED',
      error_message: error.message
    });
    return { success: false, message: error.message };
  }
}

async function testMessage(req, res) {
  try {
    const clientId = normalizePositiveInteger(getValue(req.body, 'clientId', 'client_id') || req.query.client_id || req.decoded?.client_id);
    const to = normalizeText(getValue(req.body, 'to'));
    const body = normalizeText(getValue(req.body, 'body'), 'This is a test WhatsApp message from your school portal.');
    const result = await sendMessage({
      clientId,
      to,
      body,
      moduleName: 'SETTINGS',
      eventName: 'TEST',
      recipientType: 'ADMIN'
    });

    return res.status(result.success ? 200 : 400).json({
      success: result.success,
      message: result.message || 'WhatsApp test message sent successfully',
      data: result
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function listMessages(req, res) {
  try {
    await ensureSchema();
    const clientId = normalizePositiveInteger(req.query.client_id || req.decoded?.client_id);
    const limit = Math.min(Math.max(normalizePositiveInteger(req.query.limit) || 50, 1), 200);
    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Client id is required' });
    }

    const [rows] = await db.query(`
      SELECT *
      FROM ${messagesTable}
      WHERE client_id = ?
      ORDER BY message_id DESC
      LIMIT ?
    `, [clientId, limit]);

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function notifyStudentAttendance(attendanceRows) {
  const rows = Array.isArray(attendanceRows) ? attendanceRows : [];
  const candidates = rows.filter((row) => {
    const status = String(row.status || '').trim().toUpperCase();
    return ['ABSENT', 'PRESENT'].includes(status);
  });

  if (!candidates.length) {
    return { success: true, sent: 0, skipped: 0, failed: 0 };
  }

  await ensureSchema();
  const clientIds = [...new Set(candidates.map((row) => row.clientId).filter(Boolean))];
  const configs = new Map();
  for (const clientId of clientIds) {
    configs.set(Number(clientId), await loadConfig(clientId));
  }

  const studentIds = [...new Set(candidates.map((row) => row.studentId).filter(Boolean))];
  if (!studentIds.length) {
    return { success: true, sent: 0, skipped: candidates.length, failed: 0 };
  }

  const [students] = await db.query(`
    SELECT
      s.student_id,
      s.client_id,
      CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
      s.admission_number,
      s.father_name,
      s.father_contact,
      s.mother_name,
      s.mother_contact,
      s.guardian_name,
      s.guardian_contact,
      s.phone_number,
      c.client_name AS school_name
    FROM ${studentsTable} s
    LEFT JOIN ${clientMasterTable} c ON c.client_id = s.client_id
    WHERE s.student_id IN (?)
  `, [studentIds]);
  const studentMap = new Map(students.map((student) => [Number(student.student_id), student]));

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of candidates) {
    const config = configs.get(Number(row.clientId));
    if (!config) {
      skipped += 1;
      continue;
    }

    const status = String(row.status || '').trim();
    const isAbsent = status.toUpperCase() === 'ABSENT';
    const isPresent = status.toUpperCase() === 'PRESENT';
    if ((isAbsent && !config.send_attendance_absent) || (isPresent && !config.send_attendance_present)) {
      skipped += 1;
      continue;
    }

    const student = studentMap.get(Number(row.studentId));
    const phone = normalizePhone(student?.guardian_contact || student?.father_contact || student?.mother_contact || student?.phone_number);
    if (!student || !phone) {
      skipped += 1;
      continue;
    }

    const studentName = normalizeText(student.student_name, 'Student');
    const schoolName = normalizeText(student.school_name, 'School');
    const session = normalizeText(row.attendanceSession, 'attendance');
    const date = normalizeText(row.attendanceDate, '');
    const body = `Dear parent, ${studentName} is marked ${status} for ${session} attendance on ${date}. - ${schoolName}`;
    const result = await sendMessage({
      clientId: row.clientId,
      to: phone,
      body,
      templateName: config.attendance_template_name,
      templateValues: [studentName, status, session, date, schoolName],
      moduleName: 'ATTENDANCE',
      eventName: isAbsent ? 'STUDENT_ABSENT' : 'STUDENT_PRESENT',
      recipientType: 'PARENT',
      recipientName: student.guardian_name || student.father_name || student.mother_name || 'Parent',
      studentId: row.studentId
    });

    if (result.success) {
      sent += 1;
    } else if (result.skipped) {
      skipped += 1;
    } else {
      failed += 1;
    }
  }

  return { success: failed === 0, sent, skipped, failed };
}

module.exports = {
  getConfig,
  updateConfig,
  testMessage,
  listMessages,
  sendMessage,
  notifyStudentAttendance
};
