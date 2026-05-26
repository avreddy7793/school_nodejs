const { pool } = require('../config');
const crypto = require('crypto');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const globalDatabase = process.env.DB_GLOBAL_DATABASE || process.env.DB_DATABASE || 'global';
const teachersTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('teachers')}`;
const userEntityLinksTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('user_entity_links')}`;
const loginTable = `${escapeIdentifier(globalDatabase)}.${escapeIdentifier('login')}`;
const rolesTable = `${escapeIdentifier(globalDatabase)}.${escapeIdentifier('roles')}`;
const clientMasterTable = `${escapeIdentifier(globalDatabase)}.${escapeIdentifier('client_master')}`;

const selectableColumns = `
  teacher_id,
  client_id,
  first_name,
  middle_name,
  last_name,
  date_of_birth,
  gender,
  nationality,
  religion,
  phone_number,
  alternate_phone,
  email,
  address_line1,
  address_line2,
  city,
  state,
  postal_code,
  country,
  date_of_joining,
  employment_status,
  department,
  designation,
  qualification,
  experience_years,
  subjects_taught,
  salary,
  bank_account_number,
  ifsc_code,
  achievements,
  created_at,
  updated_at,
  created_by,
  updated_by
`;

function escapeIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``;
}

const fieldMap = {
  clientId: 'client_id',
  firstName: 'first_name',
  middleName: 'middle_name',
  lastName: 'last_name',
  dateOfBirth: 'date_of_birth',
  gender: 'gender',
  nationality: 'nationality',
  religion: 'religion',
  phoneNumber: 'phone_number',
  alternatePhone: 'alternate_phone',
  email: 'email',
  addressLine1: 'address_line1',
  addressLine2: 'address_line2',
  city: 'city',
  state: 'state',
  postalCode: 'postal_code',
  country: 'country',
  dateOfJoining: 'date_of_joining',
  employmentStatus: 'employment_status',
  department: 'department',
  designation: 'designation',
  qualification: 'qualification',
  experienceYears: 'experience_years',
  subjectsTaught: 'subjects_taught',
  salary: 'salary',
  bankAccountNumber: 'bank_account_number',
  ifscCode: 'ifsc_code',
  achievements: 'achievements',
  createdBy: 'created_by',
  updatedBy: 'updated_by'
};

function today() {
  return new Date().toISOString().split('T')[0];
}

function sendDatabaseError(res, error) {
  return res.status(500).json({
    success: false,
    message: 'Database error',
    error: error.message
  });
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

function hashPassword(password) {
  const salt = crypto.randomBytes(Math.ceil(15 / 2)).toString('hex').slice(0, 15);
  const hash = crypto.createHmac('sha512', salt);
  hash.update(password);

  return {
    salt,
    passkey: hash.digest('hex')
  };
}

function buildTemporaryPassword(teacherId, phoneNumber) {
  const phoneSuffix = String(phoneNumber || '').replace(/\D/g, '').slice(-4);
  const suffix = phoneSuffix || String(Math.floor(Math.random() * 9000) + 1000);
  return `Teach@${teacherId}${suffix}`;
}

function buildTeacherName(payload) {
  return [payload.first_name, payload.middle_name, payload.last_name]
    .filter(Boolean)
    .join(' ');
}

function getValue(body, camelKey, fallback = undefined) {
  const snakeKey = fieldMap[camelKey];
  if (body[camelKey] !== undefined) {
    return body[camelKey];
  }
  if (snakeKey && body[snakeKey] !== undefined) {
    return body[snakeKey];
  }
  return fallback;
}

function buildTeacherPayload(body) {
  return {
    client_id: getValue(body, 'clientId'),
    first_name: getValue(body, 'firstName'),
    middle_name: getValue(body, 'middleName'),
    last_name: getValue(body, 'lastName'),
    date_of_birth: getValue(body, 'dateOfBirth'),
    gender: getValue(body, 'gender', 'Other'),
    nationality: getValue(body, 'nationality'),
    religion: getValue(body, 'religion'),
    phone_number: getValue(body, 'phoneNumber'),
    alternate_phone: getValue(body, 'alternatePhone'),
    email: getValue(body, 'email'),
    address_line1: getValue(body, 'addressLine1'),
    address_line2: getValue(body, 'addressLine2'),
    city: getValue(body, 'city'),
    state: getValue(body, 'state'),
    postal_code: getValue(body, 'postalCode'),
    country: getValue(body, 'country'),
    date_of_joining: getValue(body, 'dateOfJoining', today()),
    employment_status: getValue(body, 'employmentStatus', 'Active'),
    department: getValue(body, 'department'),
    designation: getValue(body, 'designation'),
    qualification: getValue(body, 'qualification'),
    experience_years: getValue(body, 'experienceYears', 0),
    subjects_taught: getValue(body, 'subjectsTaught'),
    salary: getValue(body, 'salary'),
    bank_account_number: getValue(body, 'bankAccountNumber'),
    ifsc_code: getValue(body, 'ifscCode'),
    achievements: getValue(body, 'achievements'),
    created_by: getValue(body, 'createdBy'),
    updated_by: getValue(body, 'updatedBy')
  };
}

function buildLoginOptions(body, payload) {
  return {
    createLogin: normalizeBoolean(getValue(body, 'createLogin'), true),
    loginEmail: normalizeText(getValue(body, 'loginEmail')) || normalizeText(payload.email),
    loginPassword: normalizeText(getValue(body, 'loginPassword')),
    branchId: getValue(body, 'branchId') || getValue(body, 'branch_id') || null
  };
}

function buildTeacherUpdatePayload(body) {
  const payload = {};

  Object.entries(fieldMap).forEach(([camelKey, column]) => {
    if (body[camelKey] !== undefined) {
      payload[column] = body[camelKey];
    } else if (body[column] !== undefined) {
      payload[column] = body[column];
    }
  });

  return payload;
}

function getTeachers(req, res) {
  const { client_id, department, employment_status, search } = req.query;
  const conditions = [];
  const values = [];

  if (client_id) {
    conditions.push('client_id = ?');
    values.push(client_id);
  }

  if (department) {
    conditions.push('department = ?');
    values.push(department);
  }

  if (employment_status) {
    conditions.push('employment_status = ?');
    values.push(employment_status);
  }

  if (search) {
    conditions.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone_number LIKE ?)');
    const searchValue = `%${search}%`;
    values.push(searchValue, searchValue, searchValue, searchValue);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT ${selectableColumns} FROM ${teachersTable} ${whereClause} ORDER BY updated_at DESC`;

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

function getTeacherById(req, res) {
  const sql = `SELECT ${selectableColumns} FROM ${teachersTable} WHERE teacher_id = ?`;

  pool.query(sql, [req.params.teacherId], (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: results[0]
    });
  });
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

async function getOrCreateTeacherRole(connection, clientId) {
  const [roles] = await connection.query(`
    SELECT id
    FROM ${rolesTable}
    WHERE UPPER(role_name) = 'TEACHER'
      AND (client_id = ? OR client_id IS NULL)
    ORDER BY CASE WHEN client_id = ? THEN 0 ELSE 1 END
    LIMIT 1
  `, [clientId, clientId]);

  if (roles.length) {
    return roles[0].id;
  }

  const [result] = await connection.query(
    `INSERT INTO ${rolesTable} (client_id, role_name, navbar) VALUES (?, 'TEACHER', ?)`,
    [clientId, JSON.stringify({ navbar: [] })]
  );

  return result.insertId;
}

async function createTeacherLogin(connection, payload, teacherId, loginOptions) {
  if (!loginOptions.createLogin) {
    return null;
  }

  if (!loginOptions.loginEmail) {
    const error = new Error('Teacher login email is required');
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

  const password = loginOptions.loginPassword || buildTemporaryPassword(teacherId, payload.phone_number);
  const passwordHash = hashPassword(password);
  const roleId = await getOrCreateTeacherRole(connection, payload.client_id);
  const categoryId = await getClientCategoryId(connection, payload.client_id);

  const loginPayload = {
    login_email: loginOptions.loginEmail,
    passkey: passwordHash.passkey,
    salt: passwordHash.salt,
    login_name: buildTeacherName(payload),
    login_designation: payload.designation || 'Teacher',
    login_type: 'TEACHER',
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
    entity_type: 'TEACHER',
    entity_id: teacherId,
    relationship: 'TEACHER',
    status: 'ACTIVE'
  });

  return {
    login_id: loginResult.insertId,
    login_email: loginOptions.loginEmail,
    temporary_password: password,
    role: 'TEACHER'
  };
}

async function createTeacher(req, res) {
  const payload = buildTeacherPayload(req.body);
  const loginOptions = buildLoginOptions(req.body, payload);

  if (!payload.first_name || !payload.last_name || !payload.email || !payload.phone_number || !payload.date_of_birth || !payload.date_of_joining || !payload.gender) {
    return res.status(400).json({
      success: false,
      message: 'First name, last name, email, phone number, date of birth, date of joining, and gender are required'
    });
  }

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(`INSERT INTO ${teachersTable} SET ?`, payload);
    const login = await createTeacherLogin(connection, payload, result.insertId, loginOptions);

    await connection.commit();
    return res.status(201).json({
      success: true,
      message: login ? 'Teacher created successfully with portal login' : 'Teacher created successfully',
      teacher_id: result.insertId,
      login
    });
  } catch (error) {
    await connection.rollback();

    if (error.code === 'LOGIN_EXISTS') {
      return res.status(409).json({
        success: false,
        message: 'A login already exists with this email. Use another portal login email.'
      });
    }

    if (error.code === 'LOGIN_EMAIL_REQUIRED') {
      return res.status(400).json({
        success: false,
        message: 'Teacher login email is required'
      });
    }

    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

function updateTeacher(req, res) {
  const payload = buildTeacherUpdatePayload(req.body);
  delete payload.created_by;

  const updates = Object.entries(payload).filter(([, value]) => value !== undefined);
  if (!updates.length) {
    return res.status(400).json({
      success: false,
      message: 'No update data supplied'
    });
  }

  const columns = updates.map(([key]) => `${key} = ?`);
  const values = updates.map(([, value]) => value);
  values.push(req.params.teacherId);

  pool.query(`UPDATE ${teachersTable} SET ${columns.join(', ')} WHERE teacher_id = ?`, values, (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Teacher updated successfully'
    });
  });
}

function deleteTeacher(req, res) {
  pool.query(`DELETE FROM ${teachersTable} WHERE teacher_id = ?`, [req.params.teacherId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Teacher deleted successfully'
    });
  });
}

module.exports = {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher
};
