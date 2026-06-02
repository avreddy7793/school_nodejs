const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const clientMasterTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('client_master')}`;

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

async function ensureBrandingSchema() {
  const [columns] = await pool.promise().query(`SHOW COLUMNS FROM ${clientMasterTable} LIKE 'img'`);
  const imgColumn = columns[0];

  if (imgColumn && !String(imgColumn.Type || '').toLowerCase().includes('text')) {
    await pool.promise().query(`ALTER TABLE ${clientMasterTable} MODIFY COLUMN img MEDIUMTEXT NULL`);
  }
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

module.exports = {
  getSchoolBranding,
  updateSchoolBranding
};
