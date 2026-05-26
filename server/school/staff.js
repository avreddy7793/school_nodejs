const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const staffTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('staff')}`;

const selectableColumns = `
  staff_id,
  client_id,
  employee_id,
  firstName,
  lastName,
  role,
  contactNumber,
  email,
  address,
  joiningDate,
  status,
  createdAt,
  updatedAt
`;

const roles = new Set(['DRIVER', 'CONDUCTOR', 'SUPERVISOR', 'ADMINISTRATOR']);
const statuses = new Set(['ACTIVATE', 'INACTIVE']);

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

function today() {
  return new Date().toISOString().split('T')[0];
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

function normalizeText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed || null;
}

function normalizePositiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeRole(value) {
  const role = String(value || '').trim().toUpperCase();
  return roles.has(role) ? role : null;
}

function normalizeStatus(value) {
  const status = String(value || 'ACTIVATE').trim().toUpperCase();
  return statuses.has(status) ? status : 'ACTIVATE';
}

function buildStaffPayload(body) {
  return {
    client_id: normalizePositiveInteger(getValue(body, 'clientId', 'client_id')),
    employee_id: normalizeText(getValue(body, 'employeeId', 'employee_id')),
    firstName: normalizeText(getValue(body, 'firstName')),
    lastName: normalizeText(getValue(body, 'lastName')),
    role: normalizeRole(getValue(body, 'role')),
    contactNumber: normalizeText(getValue(body, 'contactNumber', 'contact_number')),
    email: normalizeText(getValue(body, 'email')),
    address: normalizeText(getValue(body, 'address')),
    joiningDate: normalizeText(getValue(body, 'joiningDate', 'joining_date', today())),
    status: normalizeStatus(getValue(body, 'status'))
  };
}

function buildStaffUpdatePayload(body) {
  const fieldMap = {
    clientId: 'client_id',
    employeeId: 'employee_id',
    firstName: 'firstName',
    lastName: 'lastName',
    role: 'role',
    contactNumber: 'contactNumber',
    email: 'email',
    address: 'address',
    joiningDate: 'joiningDate',
    status: 'status'
  };
  const payload = {};

  Object.entries(fieldMap).forEach(([camelKey, column]) => {
    if (body[camelKey] === undefined && body[column] === undefined) {
      return;
    }

    const value = getValue(body, camelKey, column);

    if (column === 'client_id') {
      payload[column] = normalizePositiveInteger(value);
      return;
    }

    if (column === 'role') {
      payload[column] = normalizeRole(value);
      return;
    }

    if (column === 'status') {
      payload[column] = normalizeStatus(value);
      return;
    }

    payload[column] = normalizeText(value);
  });

  return payload;
}

function getNextEmployeeId(callback) {
  pool.query(`SELECT employee_id FROM ${staffTable}`, (error, results) => {
    if (error) {
      callback(error);
      return;
    }

    const maxNumber = results.reduce((max, row) => {
      const match = String(row.employee_id || '').match(/(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);

    callback(null, `STF${String(maxNumber + 1).padStart(4, '0')}`);
  });
}

function getStaff(req, res) {
  const { client_id, role, status, search } = req.query;
  const conditions = [];
  const values = [];

  if (client_id) {
    conditions.push('client_id = ?');
    values.push(client_id);
  }

  if (role) {
    conditions.push('role = ?');
    values.push(String(role).toUpperCase());
  }

  if (status) {
    conditions.push('status = ?');
    values.push(String(status).toUpperCase());
  }

  if (search) {
    conditions.push('(employee_id LIKE ? OR firstName LIKE ? OR lastName LIKE ? OR contactNumber LIKE ? OR email LIKE ?)');
    const searchValue = `%${search}%`;
    values.push(searchValue, searchValue, searchValue, searchValue, searchValue);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT ${selectableColumns} FROM ${staffTable} ${whereClause} ORDER BY updatedAt DESC, staff_id DESC`;

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

function getStaffById(req, res) {
  const clientId = req.query.client_id;
  const sql = `SELECT ${selectableColumns} FROM ${staffTable} WHERE staff_id = ? AND (? IS NULL OR client_id = ?)`;

  pool.query(sql, [req.params.staffId, clientId || null, clientId || null], (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: results[0]
    });
  });
}

function createStaff(req, res) {
  const payload = buildStaffPayload(req.body);

  if (!payload.client_id || !payload.firstName || !payload.lastName || !payload.role || !payload.contactNumber || !payload.joiningDate) {
    return res.status(400).json({
      success: false,
      message: 'Client, name, role, contact number, and joining date are required'
    });
  }

  const insertStaff = () => {
    pool.query(`INSERT INTO ${staffTable} SET ?`, payload, (error, result) => {
      if (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({
            success: false,
            message: 'Employee ID or email already exists'
          });
        }

        return sendDatabaseError(res, error);
      }

      return res.status(201).json({
        success: true,
        message: 'Staff member saved successfully',
        staff_id: result.insertId,
        employee_id: payload.employee_id
      });
    });
  };

  if (payload.employee_id) {
    insertStaff();
    return;
  }

  getNextEmployeeId((error, employeeId) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    payload.employee_id = employeeId;
    insertStaff();
  });
}

function updateStaff(req, res) {
  const payload = buildStaffUpdatePayload(req.body);

  if (!Object.keys(payload).length) {
    return res.status(400).json({
      success: false,
      message: 'No update data supplied'
    });
  }

  if (Object.values(payload).some((value) => value === null)) {
    return res.status(400).json({
      success: false,
      message: 'Update values must be valid'
    });
  }

  pool.query(`UPDATE ${staffTable} SET ? WHERE staff_id = ?`, [payload, req.params.staffId], (error, result) => {
    if (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'Employee ID or email already exists'
        });
      }

      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Staff member updated successfully'
    });
  });
}

function deleteStaff(req, res) {
  pool.query(`DELETE FROM ${staffTable} WHERE staff_id = ?`, [req.params.staffId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Staff member deleted successfully'
    });
  });
}

module.exports = {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff
};
