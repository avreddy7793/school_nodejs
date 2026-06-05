const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const clientMasterTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('client_master')}`;
const schoolSettingsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('school_settings')}`;

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

function getValue(body, camelKey, snakeKey = camelKey) {
  if (body[camelKey] !== undefined) {
    return body[camelKey];
  }

  return body[snakeKey];
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : String(value).slice(0, 10);
}

function defaultAcademicYear(today = new Date()) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const startYear = month >= 5 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

function defaultAcademicStart(today = new Date()) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const startYear = month >= 5 ? year : year - 1;
  return `${startYear}-06-01`;
}

function defaultAcademicEnd(today = new Date()) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const startYear = month >= 5 ? year : year - 1;
  return `${startYear + 1}-05-31`;
}

async function ensureBrandingSchema() {
  const [columns] = await pool.promise().query(`SHOW COLUMNS FROM ${clientMasterTable} LIKE 'img'`);
  const imgColumn = columns[0];

  if (imgColumn && !String(imgColumn.Type || '').toLowerCase().includes('text')) {
    await pool.promise().query(`ALTER TABLE ${clientMasterTable} MODIFY COLUMN img MEDIUMTEXT NULL`);
  }
}

async function ensureSettingsSchema() {
  await pool.promise().query(`
    CREATE TABLE IF NOT EXISTS ${schoolSettingsTable} (
      setting_id int NOT NULL AUTO_INCREMENT,
      client_id bigint NOT NULL,
      current_academic_year varchar(20) DEFAULT NULL,
      academic_year_start_date date DEFAULT NULL,
      academic_year_end_date date DEFAULT NULL,
      created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (setting_id),
      UNIQUE KEY uq_school_settings_client (client_id),
      KEY idx_school_settings_year (current_academic_year)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
}

function mapBranding(row) {
  return {
    client_id: row.client_id,
    school_name: row.client_name || '',
    school_address: row.client_address || '',
    school_logo_url: row.img || '',
    owner_name: row.owner_name || '',
    phone_number: row.mobile_number || '',
    email: row.email || ''
  };
}

function selectBranding(clientId, callback) {
  const sql = `
    SELECT client_id, client_name, client_address, img, owner_name, mobile_number, email
    FROM ${clientMasterTable}
    WHERE client_id = ?
    LIMIT 1
  `;

  pool.query(sql, [clientId], callback);
}

async function getSchoolBranding(req, res) {
  try {
    await ensureBrandingSchema();
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const clientId = normalizePositiveInteger(req.query.client_id || req.decoded?.client_id);
  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'Client id is required'
    });
  }

  selectBranding(clientId, (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: 'School profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: mapBranding(results[0])
    });
  });
}

async function updateSchoolBranding(req, res) {
  try {
    await ensureBrandingSchema();
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const clientId = normalizePositiveInteger(getValue(req.body, 'clientId', 'client_id') || req.query.client_id || req.decoded?.client_id);
  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'Client id is required'
    });
  }

  const payload = {
    client_name: normalizeText(getValue(req.body, 'schoolName', 'school_name')),
    client_address: normalizeText(getValue(req.body, 'schoolAddress', 'school_address')),
    img: normalizeText(getValue(req.body, 'schoolLogoUrl', 'school_logo_url')),
    mobile_number: normalizeText(getValue(req.body, 'phoneNumber', 'phone_number')),
    email: normalizeText(getValue(req.body, 'email'))
  };

  const sql = `UPDATE ${clientMasterTable} SET ? WHERE client_id = ?`;
  pool.query(sql, [payload, clientId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'School profile not found'
      });
    }

    return selectBranding(clientId, (selectError, results) => {
      if (selectError) {
        return sendDatabaseError(res, selectError);
      }

      return res.status(200).json({
        success: true,
        message: 'School branding saved successfully',
        data: mapBranding(results[0])
      });
    });
  });
}

async function getAcademicCalendar(req, res) {
  try {
    await ensureSettingsSchema();
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const clientId = normalizePositiveInteger(req.query.client_id || req.decoded?.client_id);
  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'Client id is required'
    });
  }

  pool.query(`SELECT * FROM ${schoolSettingsTable} WHERE client_id = ? LIMIT 1`, [clientId], (error, rows) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    const row = rows[0] || {};
    return res.status(200).json({
      success: true,
      data: {
        client_id: clientId,
        current_academic_year: row.current_academic_year || defaultAcademicYear(),
        academic_year_start_date: row.academic_year_start_date || defaultAcademicStart(),
        academic_year_end_date: row.academic_year_end_date || defaultAcademicEnd()
      }
    });
  });
}

async function updateAcademicCalendar(req, res) {
  try {
    await ensureSettingsSchema();
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const clientId = normalizePositiveInteger(getValue(req.body, 'clientId', 'client_id') || req.query.client_id || req.decoded?.client_id);
  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'Client id is required'
    });
  }

  const payload = {
    current_academic_year: normalizeText(getValue(req.body, 'currentAcademicYear', 'current_academic_year')) || defaultAcademicYear(),
    academic_year_start_date: normalizeDate(getValue(req.body, 'academicYearStartDate', 'academic_year_start_date')),
    academic_year_end_date: normalizeDate(getValue(req.body, 'academicYearEndDate', 'academic_year_end_date'))
  };

  if (!payload.academic_year_start_date || !payload.academic_year_end_date) {
    return res.status(400).json({
      success: false,
      message: 'Academic start and end dates are required'
    });
  }

  if (payload.academic_year_end_date < payload.academic_year_start_date) {
    return res.status(400).json({
      success: false,
      message: 'Academic end date cannot be before start date'
    });
  }

  pool.query(`
    INSERT INTO ${schoolSettingsTable}
      (client_id, current_academic_year, academic_year_start_date, academic_year_end_date)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      current_academic_year = VALUES(current_academic_year),
      academic_year_start_date = VALUES(academic_year_start_date),
      academic_year_end_date = VALUES(academic_year_end_date)
  `, [clientId, payload.current_academic_year, payload.academic_year_start_date, payload.academic_year_end_date], (error) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    return res.status(200).json({
      success: true,
      message: 'Academic calendar saved successfully',
      data: {
        client_id: clientId,
        ...payload
      }
    });
  });
}

module.exports = {
  getSchoolBranding,
  updateSchoolBranding,
  getAcademicCalendar,
  updateAcademicCalendar
};
