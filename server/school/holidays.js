const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const db = pool.promise();
const holidaysTable = table('school_holidays');
const classroomsTable = table('classrooms');

const audiences = new Set(['ALL', 'STUDENTS', 'TEACHERS', 'STAFF']);
const statuses = new Set(['DRAFT', 'PUBLISHED']);

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

function normalizeText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed || null;
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : String(value).slice(0, 10);
}

function normalizeAudience(value) {
  const audience = String(value || 'ALL').trim().toUpperCase();
  return audiences.has(audience) ? audience : 'ALL';
}

function normalizeStatus(value) {
  const status = String(value || 'DRAFT').trim().toUpperCase();
  return statuses.has(status) ? status : 'DRAFT';
}

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${holidaysTable} (
      holiday_id int NOT NULL AUTO_INCREMENT,
      client_id bigint DEFAULT NULL,
      title varchar(150) NOT NULL,
      description text,
      start_date date NOT NULL,
      end_date date NOT NULL,
      applicable_to enum('ALL','STUDENTS','TEACHERS','STAFF') NOT NULL DEFAULT 'ALL',
      classroom_id int DEFAULT NULL,
      status enum('DRAFT','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
      created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (holiday_id),
      KEY school_holidays_client_idx (client_id),
      KEY school_holidays_dates_idx (start_date, end_date),
      KEY school_holidays_status_idx (status),
      KEY school_holidays_classroom_idx (classroom_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
}

function buildPayload(body) {
  const startDate = normalizeDate(body.startDate ?? body.start_date);
  const endDate = normalizeDate(body.endDate ?? body.end_date) || startDate;
  const audience = normalizeAudience(body.applicableTo ?? body.applicable_to);

  return {
    client_id: normalizePositiveInteger(body.clientId ?? body.client_id),
    title: normalizeText(body.title),
    description: normalizeText(body.description),
    start_date: startDate,
    end_date: endDate,
    applicable_to: audience,
    classroom_id: audience === 'STUDENTS' ? normalizePositiveInteger(body.classroomId ?? body.classroom_id) : null,
    status: normalizeStatus(body.status)
  };
}

async function listHolidays(req, res) {
  try {
    await ensureTable();
    const clientId = normalizePositiveInteger(req.query.client_id);
    const status = req.query.status ? normalizeStatus(req.query.status) : '';
    const audience = req.query.applicable_to ? normalizeAudience(req.query.applicable_to) : '';
    const conditions = [];
    const values = [];

    if (clientId) {
      conditions.push('h.client_id = ?');
      values.push(clientId);
    }

    if (status) {
      conditions.push('h.status = ?');
      values.push(status);
    }

    if (audience) {
      conditions.push('h.applicable_to = ?');
      values.push(audience);
    }

    if (req.query.date_from) {
      conditions.push('h.end_date >= ?');
      values.push(String(req.query.date_from).slice(0, 10));
    }

    if (req.query.date_to) {
      conditions.push('h.start_date <= ?');
      values.push(String(req.query.date_to).slice(0, 10));
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await db.query(`
      SELECT
        h.*,
        c.name AS classroom_name
      FROM ${holidaysTable} h
      LEFT JOIN ${classroomsTable} c ON c.classroom_id = h.classroom_id
      ${whereClause}
      ORDER BY h.start_date ASC, h.holiday_id DESC
    `, values);

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function createHoliday(req, res) {
  try {
    await ensureTable();
    const payload = buildPayload(req.body);
    if (!payload.client_id || !payload.title || !payload.start_date || !payload.end_date) {
      return res.status(400).json({ success: false, message: 'Client, title, start date, and end date are required.' });
    }

    if (payload.end_date < payload.start_date) {
      return res.status(400).json({ success: false, message: 'End date cannot be before start date.' });
    }

    const [result] = await db.query(`INSERT INTO ${holidaysTable} SET ?`, payload);
    return res.status(201).json({
      success: true,
      message: 'Holiday saved successfully.',
      data: { holiday_id: result.insertId, ...payload }
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function updateHoliday(req, res) {
  try {
    await ensureTable();
    const holidayId = normalizePositiveInteger(req.params.holidayId);
    const payload = buildPayload(req.body);
    delete payload.client_id;

    if (!holidayId) {
      return res.status(400).json({ success: false, message: 'Holiday is required.' });
    }

    if (!payload.title || !payload.start_date || !payload.end_date) {
      return res.status(400).json({ success: false, message: 'Title, start date, and end date are required.' });
    }

    if (payload.end_date < payload.start_date) {
      return res.status(400).json({ success: false, message: 'End date cannot be before start date.' });
    }

    const [result] = await db.query(`UPDATE ${holidaysTable} SET ? WHERE holiday_id = ?`, [payload, holidayId]);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Holiday not found.' });
    }

    return res.status(200).json({ success: true, message: 'Holiday updated successfully.' });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function publishHoliday(req, res) {
  try {
    await ensureTable();
    const holidayId = normalizePositiveInteger(req.params.holidayId);
    const status = normalizeStatus(req.body.status || 'PUBLISHED');
    if (!holidayId) {
      return res.status(400).json({ success: false, message: 'Holiday is required.' });
    }

    const [result] = await db.query(`UPDATE ${holidaysTable} SET status = ? WHERE holiday_id = ?`, [status, holidayId]);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Holiday not found.' });
    }

    return res.status(200).json({
      success: true,
      message: status === 'PUBLISHED' ? 'Holiday published successfully.' : 'Holiday moved to draft.'
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function deleteHoliday(req, res) {
  try {
    await ensureTable();
    const holidayId = normalizePositiveInteger(req.params.holidayId);
    if (!holidayId) {
      return res.status(400).json({ success: false, message: 'Holiday is required.' });
    }

    const [result] = await db.query(`DELETE FROM ${holidaysTable} WHERE holiday_id = ?`, [holidayId]);
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'Holiday not found.' });
    }

    return res.status(200).json({ success: true, message: 'Holiday deleted successfully.' });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

module.exports = {
  ensureTable,
  listHolidays,
  createHoliday,
  updateHoliday,
  publishHoliday,
  deleteHoliday
};
