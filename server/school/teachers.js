const { pool } = require('../config');
const crypto = require('crypto');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const globalDatabase = process.env.DB_GLOBAL_DATABASE || process.env.DB_DATABASE || 'global';
const teachersTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('teachers')}`;
const userEntityLinksTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('user_entity_links')}`;
const teacherSubjectsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('teacher_subjects')}`;
const subjectsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('subjects')}`;
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

function isMissingTableError(error) {
  return Boolean(error) && (error.code === 'ER_NO_SUCH_TABLE' || error.errno === 1146);
}

function normalizeSubjectIds(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const list = Array.isArray(value) ? value : String(value).split(',');
  const ids = [];

  list.forEach((item) => {
    const parsed = Number(item);
    if (Number.isInteger(parsed) && parsed > 0 && !ids.includes(parsed)) {
      ids.push(parsed);
    }
  });

  return ids;
}

async function ensureTeacherSubjectsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ${teacherSubjectsTable} (
      id int NOT NULL AUTO_INCREMENT,
      client_id bigint DEFAULT NULL,
      teacher_id int NOT NULL,
      subject_id int NOT NULL,
      status enum('Active','Inactive') NOT NULL DEFAULT 'Active',
      created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_teacher_subject (teacher_id, subject_id),
      KEY idx_teacher_subjects_client_id (client_id),
      KEY idx_teacher_subjects_teacher_id (teacher_id),
      KEY idx_teacher_subjects_subject_id (subject_id),
      CONSTRAINT fk_teacher_subjects_teacher FOREIGN KEY (teacher_id) REFERENCES ${teachersTable} (teacher_id) ON DELETE CASCADE,
      CONSTRAINT fk_teacher_subjects_subject FOREIGN KEY (subject_id) REFERENCES ${subjectsTable} (subject_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
}

async function fetchSubjectsForTeachers(connection, teacherIds) {
  const map = {};
  if (!teacherIds.length) {
    return map;
  }

  try {
    const [rows] = await connection.query(
      `SELECT ts.teacher_id, s.subject_id, s.sub_name
       FROM ${teacherSubjectsTable} ts
       JOIN ${subjectsTable} s ON s.subject_id = ts.subject_id
       WHERE ts.status = 'Active' AND ts.teacher_id IN (?)
       ORDER BY s.sub_name ASC`,
      [teacherIds]
    );

    rows.forEach((row) => {
      if (!map[row.teacher_id]) {
        map[row.teacher_id] = [];
      }
      map[row.teacher_id].push({ subject_id: row.subject_id, sub_name: row.sub_name });
    });
  } catch (error) {
    if (!isMissingTableError(error)) {
      throw error;
    }
  }

  return map;
}

async function teacherUsedInTable(connection, tableName, teacherId) {
  const targetTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier(tableName)}`;

  try {
    const [rows] = await connection.query(
      `SELECT 1 FROM ${targetTable} WHERE teacher_id = ? LIMIT 1`,
      [teacherId]
    );
    return rows.length > 0;
  } catch (error) {
    if (isMissingTableError(error)) {
      return false;
    }
    throw error;
  }
}

// Syncs teacher_subjects rows for a teacher and refreshes the
// subjects_taught text column for backward compatibility.
async function syncTeacherSubjects(connection, teacherId, subjectIds, clientId) {
  await ensureTeacherSubjectsTable(connection);

  let subjectNames = [];

  if (subjectIds.length) {
    const [subjects] = await connection.query(
      `SELECT subject_id, sub_name FROM ${subjectsTable} WHERE subject_id IN (?)`,
      [subjectIds]
    );

    if (subjects.length !== subjectIds.length) {
      const error = new Error('One or more selected subjects do not exist');
      error.code = 'INVALID_SUBJECT_IDS';
      throw error;
    }

    const nameById = new Map(subjects.map((subject) => [subject.subject_id, subject.sub_name]));
    subjectNames = subjectIds.map((id) => nameById.get(id)).filter(Boolean);
  }

  await connection.query(`DELETE FROM ${teacherSubjectsTable} WHERE teacher_id = ?`, [teacherId]);

  if (subjectIds.length) {
    const rows = subjectIds.map((subjectId) => [clientId || null, teacherId, subjectId, 'Active']);
    await connection.query(
      `INSERT INTO ${teacherSubjectsTable} (client_id, teacher_id, subject_id, status) VALUES ?`,
      [rows]
    );
  }

  await connection.query(
    `UPDATE ${teachersTable} SET subjects_taught = ? WHERE teacher_id = ?`,
    [subjectNames.join(', '), teacherId]
  );
}

async function getTeachers(req, res) {
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

  const connection = await pool.promise().getConnection();

  try {
    const [results] = await connection.query(sql, values);
    const teacherIds = results.map((teacher) => teacher.teacher_id);
    const subjectsByTeacher = await fetchSubjectsForTeachers(connection, teacherIds);

    const data = results.map((teacher) => ({
      ...teacher,
      subjects: subjectsByTeacher[teacher.teacher_id] || []
    }));

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

async function getTeacherById(req, res) {
  const { teacherId } = req.params;
  const sql = `SELECT ${selectableColumns} FROM ${teachersTable} WHERE teacher_id = ?`;

  const connection = await pool.promise().getConnection();

  try {
    const [results] = await connection.query(sql, [teacherId]);

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const subjectsByTeacher = await fetchSubjectsForTeachers(connection, [results[0].teacher_id]);
    const subjects = subjectsByTeacher[results[0].teacher_id] || [];

    return res.status(200).json({
      success: true,
      data: {
        ...results[0],
        subjects,
        subject_ids: subjects.map((subject) => subject.subject_id)
      }
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
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

    const subjectIds = normalizeSubjectIds(getValue(req.body, 'subjectIds') ?? req.body.subject_ids);
    if (subjectIds !== null) {
      await syncTeacherSubjects(connection, result.insertId, subjectIds, payload.client_id);
    }

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

    if (error.code === 'INVALID_SUBJECT_IDS') {
      return res.status(400).json({
        success: false,
        message: 'One or more selected subjects do not exist'
      });
    }

    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

async function updateTeacher(req, res) {
  const teacherId = req.params.teacherId;
  const payload = buildTeacherUpdatePayload(req.body);
  delete payload.created_by;

  const requiredFields = ['first_name', 'last_name', 'email', 'phone_number', 'date_of_birth', 'date_of_joining', 'gender'];
  const emptyRequiredField = requiredFields.find((field) => {
    if (!(field in payload)) {
      return false;
    }
    const value = payload[field];
    return value === null || value === undefined || String(value).trim() === '';
  });

  if (emptyRequiredField) {
    return res.status(400).json({
      success: false,
      message: `${emptyRequiredField} cannot be empty`
    });
  }

  const subjectIds = normalizeSubjectIds(getValue(req.body, 'subjectIds') ?? req.body.subject_ids);
  const updates = Object.entries(payload).filter(([, value]) => value !== undefined);

  if (!updates.length && subjectIds === null) {
    return res.status(400).json({
      success: false,
      message: 'No update data supplied'
    });
  }

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query(
      `SELECT teacher_id, client_id FROM ${teachersTable} WHERE teacher_id = ?`,
      [teacherId]
    );

    if (!existingRows.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    if (payload.email) {
      const [emailRows] = await connection.query(
        `SELECT teacher_id FROM ${teachersTable} WHERE email = ? AND teacher_id <> ? LIMIT 1`,
        [payload.email, teacherId]
      );

      if (emailRows.length) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: 'Email already exists for another teacher'
        });
      }
    }

    if (updates.length) {
      const columns = updates.map(([key]) => `${key} = ?`);
      const updateValues = updates.map(([, value]) => value);
      updateValues.push(teacherId);
      await connection.query(`UPDATE ${teachersTable} SET ${columns.join(', ')} WHERE teacher_id = ?`, updateValues);
    }

    if (subjectIds !== null) {
      const clientId = payload.client_id ?? existingRows[0].client_id;
      await syncTeacherSubjects(connection, Number(teacherId), subjectIds, clientId);
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Teacher updated successfully'
    });
  } catch (error) {
    await connection.rollback();

    if (error.code === 'INVALID_SUBJECT_IDS') {
      return res.status(400).json({
        success: false,
        message: 'One or more selected subjects do not exist'
      });
    }

    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

async function deleteTeacher(req, res) {
  const teacherId = req.params.teacherId;
  const connection = await pool.promise().getConnection();

  try {
    const [existingRows] = await connection.query(
      `SELECT teacher_id FROM ${teachersTable} WHERE teacher_id = ?`,
      [teacherId]
    );

    if (!existingRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const dependencyTables = ['class_schedule', 'classroom_sessions', 'teacher_subject_assignments', 'teacher_attendance'];
    let isUsed = false;

    for (const tableName of dependencyTables) {
      // eslint-disable-next-line no-await-in-loop
      if (await teacherUsedInTable(connection, tableName, teacherId)) {
        isUsed = true;
        break;
      }
    }

    if (isUsed) {
      await connection.query(
        `UPDATE ${teachersTable} SET employment_status = 'Inactive' WHERE teacher_id = ?`,
        [teacherId]
      );

      return res.status(200).json({
        success: true,
        message: 'Teacher is already used in schedules or attendance, so marked as inactive.'
      });
    }

    await connection.beginTransaction();

    try {
      try {
        await connection.query(`DELETE FROM ${teacherSubjectsTable} WHERE teacher_id = ?`, [teacherId]);
      } catch (error) {
        if (!isMissingTableError(error)) {
          throw error;
        }
      }

      try {
        await connection.query(
          `DELETE FROM ${userEntityLinksTable} WHERE entity_type = 'TEACHER' AND entity_id = ?`,
          [teacherId]
        );
      } catch (error) {
        if (!isMissingTableError(error)) {
          throw error;
        }
      }

      await connection.query(`DELETE FROM ${teachersTable} WHERE teacher_id = ?`, [teacherId]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: 'Teacher deleted successfully'
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

module.exports = {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher
};
