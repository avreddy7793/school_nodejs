const crypto = require('crypto');
const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const staffTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('staff')}`;
const loginTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('login')}`;
const rolesTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('roles')}`;
const clientMasterTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('client_master')}`;
const userEntityLinksTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('user_entity_links')}`;

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
  salary,
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

function normalizeBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return !['false', '0', 'no'].includes(String(value).trim().toLowerCase());
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

function normalizeDecimal(value, fallback = null) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
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
    status: normalizeStatus(getValue(body, 'status')),
    salary: normalizeDecimal(getValue(body, 'salary'))
  };
}

function buildStaffLoginOptions(body, payload) {
  return {
    createLogin: normalizeBoolean(getValue(body, 'createLogin', 'create_login'), true),
    loginEmail: normalizeText(getValue(body, 'loginEmail', 'login_email')) || normalizeText(payload.email),
    loginPassword: normalizeText(getValue(body, 'loginPassword', 'login_password')),
    branchId: normalizePositiveInteger(getValue(body, 'branchId', 'branch_id'))
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
    status: 'status',
    salary: 'salary'
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

    if (column === 'salary') {
      payload[column] = normalizeDecimal(value);
      return;
    }

    payload[column] = normalizeText(value);
  });

  return payload;
}

function invalidRequiredStaffUpdateFields(payload) {
  const requiredFields = ['client_id', 'employee_id', 'firstName', 'lastName', 'role', 'contactNumber', 'joiningDate', 'status'];

  return requiredFields.filter((field) =>
    Object.prototype.hasOwnProperty.call(payload, field) && payload[field] === null
  );
}

async function getNextEmployeeIdAsync(connection) {
  const [results] = await connection.query(`SELECT employee_id FROM ${staffTable}`);
  const maxNumber = results.reduce((max, row) => {
    const match = String(row.employee_id || '').match(/(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  return `STF${String(maxNumber + 1).padStart(3, '0')}`;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(Math.ceil(15 / 2)).toString('hex').slice(0, 15);
  const hash = crypto.createHmac('sha512', salt);
  hash.update(password);

  return {
    salt,
    passkey: hash.digest('hex')
  };
}

function buildStaffName(payload) {
  return [payload.firstName, payload.lastName].filter(Boolean).join(' ');
}

function buildTemporaryPassword(staffId, contactNumber) {
  const phoneSuffix = String(contactNumber || '').replace(/\D/g, '').slice(-4);
  const suffix = phoneSuffix || String(Math.floor(Math.random() * 9000) + 1000);
  return `Staff@${staffId}${suffix}`;
}

async function ensureUserEntityLinksTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ${userEntityLinksTable} (
      link_id int NOT NULL AUTO_INCREMENT,
      client_id bigint NOT NULL,
      login_id int NOT NULL,
      entity_type enum('TEACHER','STUDENT','PARENT','STAFF') NOT NULL,
      entity_id int NOT NULL,
      relationship varchar(50) DEFAULT NULL,
      status enum('ACTIVE','INACTIVE') DEFAULT 'ACTIVE',
      PRIMARY KEY (link_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
}

async function getClientCategoryId(connection, clientId) {
  const [rows] = await connection.query(`SELECT category FROM ${clientMasterTable} WHERE client_id = ?`, [clientId]);
  return rows[0]?.category || null;
}

async function getOrCreateStaffRole(connection, clientId) {
  const [roles] = await connection.query(`
    SELECT id
    FROM ${rolesTable}
    WHERE UPPER(role_name) = 'STAFF'
      AND (client_id = ? OR client_id IS NULL)
    ORDER BY CASE WHEN client_id = ? THEN 0 ELSE 1 END
    LIMIT 1
  `, [clientId, clientId]);

  if (roles.length) {
    return roles[0].id;
  }

  const [result] = await connection.query(
    `INSERT INTO ${rolesTable} (client_id, role_name, navbar) VALUES (?, 'STAFF', ?)`,
    [clientId, JSON.stringify({ navbar: [] })]
  );

  return result.insertId;
}

async function createStaffLogin(connection, payload, staffId, loginOptions) {
  if (!loginOptions.createLogin) {
    return null;
  }

  if (!loginOptions.loginEmail) {
    const error = new Error('Staff login email is required');
    error.code = 'LOGIN_EMAIL_REQUIRED';
    throw error;
  }

  const [existingLogins] = await connection.query(`SELECT login_id FROM ${loginTable} WHERE login_email = ? LIMIT 1`, [loginOptions.loginEmail]);
  if (existingLogins.length) {
    const error = new Error('A login already exists with this email');
    error.code = 'LOGIN_EXISTS';
    throw error;
  }

  await ensureUserEntityLinksTable(connection);

  const password = loginOptions.loginPassword || buildTemporaryPassword(staffId, payload.contactNumber);
  const passwordHash = hashPassword(password);
  const roleId = await getOrCreateStaffRole(connection, payload.client_id);
  const categoryId = await getClientCategoryId(connection, payload.client_id);

  const loginPayload = {
    login_email: loginOptions.loginEmail,
    passkey: passwordHash.passkey,
    salt: passwordHash.salt,
    login_name: buildStaffName(payload),
    login_designation: payload.role || 'Staff',
    login_type: 'STAFF',
    client_id: payload.client_id,
    created_by: null,
    emp_id: null,
    status: 'ACTIVATED',
    category: categoryId,
    role: roleId,
    password: null,
    branch_id: loginOptions.branchId || null
  };

  const [loginResult] = await connection.query(`INSERT INTO ${loginTable} SET ?`, loginPayload);

  await connection.query(`INSERT INTO ${userEntityLinksTable} SET ?`, {
    client_id: payload.client_id,
    login_id: loginResult.insertId,
    entity_type: 'STAFF',
    entity_id: staffId,
    relationship: payload.role || 'STAFF',
    status: 'ACTIVE'
  });

  return {
    login_id: loginResult.insertId,
    login_email: loginOptions.loginEmail,
    temporary_password: password,
    role: 'STAFF'
  };
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

async function createStaff(req, res) {
  const payload = buildStaffPayload(req.body);
  const loginOptions = buildStaffLoginOptions(req.body, payload);

  if (!payload.client_id || !payload.firstName || !payload.lastName || !payload.role || !payload.contactNumber || !payload.joiningDate) {
    return res.status(400).json({
      success: false,
      message: 'Client, name, role, contact number, and joining date are required'
    });
  }

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    if (!payload.employee_id) {
      payload.employee_id = await getNextEmployeeIdAsync(connection);
    }

    const [result] = await connection.query(`INSERT INTO ${staffTable} SET ?`, payload);
    const login = await createStaffLogin(connection, payload, result.insertId, loginOptions);

    await connection.commit();
    return res.status(201).json({
      success: true,
      message: login ? 'Staff member saved successfully with portal login' : 'Staff member saved successfully',
      staff_id: result.insertId,
      employee_id: payload.employee_id,
      login
    });
  } catch (error) {
    await connection.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Employee ID or email already exists'
      });
    }

    if (error.code === 'LOGIN_EXISTS') {
      return res.status(409).json({
        success: false,
        message: 'A login already exists with this email. Use another portal login email.'
      });
    }

    if (error.code === 'LOGIN_EMAIL_REQUIRED') {
      return res.status(400).json({
        success: false,
        message: 'Staff login email is required'
      });
    }

    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

function updateStaff(req, res) {
  const payload = buildStaffUpdatePayload(req.body);

  if (!Object.keys(payload).length) {
    return res.status(400).json({
      success: false,
      message: 'No update data supplied'
    });
  }

  if (invalidRequiredStaffUpdateFields(payload).length) {
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
