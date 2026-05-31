const { pool } = require('../config');
const crypto = require('crypto');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const globalDatabase = process.env.DB_GLOBAL_DATABASE || process.env.DB_DATABASE || 'global';
const teachersTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('teachers')}`;
const subjectsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('subjects')}`;
const classroomsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('classrooms')}`;
const teacherSubjectsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('teacher_subjects')}`;
const teacherSubjectAssignmentsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('teacher_subject_assignments')}`;
const classScheduleTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('class_schedule')}`;
const classroomSessionsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('classroom_sessions')}`;
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

function prefixedTeacherColumns(alias = 't') {
  return selectableColumns
    .split(',')
    .map((column) => column.trim())
    .filter(Boolean)
    .map((column) => `${alias}.${escapeIdentifier(column)} AS ${escapeIdentifier(column)}`)
    .join(',\n  ');
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

function normalizePositiveInteger(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseSubjectIds(body = {}) {
  const rawValue = body.subject_ids !== undefined ? body.subject_ids : body.subjectIds;
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return [];
  }

  const rawItems = Array.isArray(rawValue) ? rawValue : String(rawValue).split(',');
  return Array.from(new Set(
    rawItems
      .map((subjectId) => normalizePositiveInteger(subjectId))
      .filter((subjectId) => subjectId !== null)
  ));
}

function hasSubjectIds(body = {}) {
  return body.subject_ids !== undefined || body.subjectIds !== undefined;
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

function mapTeacherWithSubjects(rows) {
  const teachers = new Map();

  rows.forEach((row) => {
    const subjectId = row.assigned_subject_id;
    const subjectName = row.assigned_subject_name;
    delete row.assigned_subject_id;
    delete row.assigned_subject_name;

    if (!teachers.has(row.teacher_id)) {
      teachers.set(row.teacher_id, {
        ...row,
        teacher_name: buildTeacherName(row),
        subject_ids: [],
        subjects: []
      });
    }

    const teacher = teachers.get(row.teacher_id);
    if (subjectId && !teacher.subject_ids.includes(subjectId)) {
      teacher.subject_ids.push(subjectId);
      teacher.subjects.push({
        subject_id: subjectId,
        sub_name: subjectName
      });
    }
  });

  return Array.from(teachers.values());
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

async function validateSubjectIds(connection, subjectIds, clientId) {
  if (!subjectIds.length) {
    return;
  }

  const placeholders = subjectIds.map(() => '?').join(', ');
  const values = [...subjectIds];
  let clientFilter = '';

  if (clientId) {
    clientFilter = ' AND client_id = ?';
    values.push(clientId);
  }

  const [rows] = await connection.query(
    `
      SELECT subject_id
      FROM ${subjectsTable}
      WHERE subject_id IN (${placeholders})
      ${clientFilter}
    `,
    values
  );

  if (rows.length !== subjectIds.length) {
    const error = new Error('One or more selected subjects are invalid for this client.');
    error.code = 'INVALID_SUBJECT_IDS';
    throw error;
  }
}

async function insertTeacherSubjects(connection, teacherId, subjectIds, clientId) {
  if (!subjectIds.length) {
    return;
  }

  const values = subjectIds.map((subjectId) => [clientId || null, teacherId, subjectId]);
  await connection.query(
    `INSERT INTO ${teacherSubjectsTable} (client_id, teacher_id, subject_id) VALUES ?`,
    [values]
  );
}

async function replaceTeacherSubjects(connection, teacherId, subjectIds, clientId) {
  await connection.query(`DELETE FROM ${teacherSubjectsTable} WHERE teacher_id = ?`, [teacherId]);
  await insertTeacherSubjects(connection, teacherId, subjectIds, clientId);
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
    conditions.push('t.client_id = ?');
    values.push(client_id);
  }

  if (department) {
    conditions.push('t.department = ?');
    values.push(department);
  }

  if (employment_status) {
    conditions.push('t.employment_status = ?');
    values.push(employment_status);
  }

  if (search) {
    conditions.push('(t.first_name LIKE ? OR t.last_name LIKE ? OR t.email LIKE ? OR t.phone_number LIKE ? OR s.sub_name LIKE ?)');
    const searchValue = `%${search}%`;
    values.push(searchValue, searchValue, searchValue, searchValue, searchValue);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT
      ${prefixedTeacherColumns('t')},
      ts.subject_id AS assigned_subject_id,
      s.sub_name AS assigned_subject_name
    FROM ${teachersTable} t
    LEFT JOIN ${teacherSubjectsTable} ts ON ts.teacher_id = t.teacher_id
    LEFT JOIN ${subjectsTable} s ON s.subject_id = ts.subject_id
    ${whereClause}
    ORDER BY t.updated_at DESC, s.sub_name ASC
  `;

  pool.query(sql, values, (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    return res.status(200).json({
      success: true,
      data: mapTeacherWithSubjects(results)
    });
  });
}

function getTeacherById(req, res) {
  const sql = `
    SELECT
      ${prefixedTeacherColumns('t')},
      ts.subject_id AS assigned_subject_id,
      s.sub_name AS assigned_subject_name
    FROM ${teachersTable} t
    LEFT JOIN ${teacherSubjectsTable} ts ON ts.teacher_id = t.teacher_id
    LEFT JOIN ${subjectsTable} s ON s.subject_id = ts.subject_id
    WHERE t.teacher_id = ?
    ORDER BY s.sub_name ASC
  `;

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
      data: mapTeacherWithSubjects(results)[0]
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
  const subjectIds = parseSubjectIds(req.body);

  if (!payload.first_name || !payload.last_name || !payload.email || !payload.phone_number || !payload.date_of_birth || !payload.date_of_joining || !payload.gender) {
    return res.status(400).json({
      success: false,
      message: 'First name, last name, email, phone number, date of birth, date of joining, and gender are required'
    });
  }

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();
    await validateSubjectIds(connection, subjectIds, payload.client_id);

    const [result] = await connection.query(`INSERT INTO ${teachersTable} SET ?`, payload);
    await insertTeacherSubjects(connection, result.insertId, subjectIds, payload.client_id);
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

    if (error.code === 'INVALID_SUBJECT_IDS') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

async function updateTeacher(req, res) {
  const payload = buildTeacherUpdatePayload(req.body);
  delete payload.created_by;
  const subjectIdsProvided = hasSubjectIds(req.body);
  const subjectIds = parseSubjectIds(req.body);

  const updates = Object.entries(payload).filter(([, value]) => value !== undefined);
  if (!updates.length && !subjectIdsProvided) {
    return res.status(400).json({
      success: false,
      message: 'No update data supplied'
    });
  }

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query(
      `SELECT teacher_id, client_id FROM ${teachersTable} WHERE teacher_id = ? LIMIT 1`,
      [req.params.teacherId]
    );

    if (!existingRows.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const clientIdForSubjects = payload.client_id !== undefined ? payload.client_id : existingRows[0].client_id;

    if (updates.length) {
      const columns = updates.map(([key]) => `${key} = ?`);
      const values = updates.map(([, value]) => value);
      values.push(req.params.teacherId);

      await connection.query(`UPDATE ${teachersTable} SET ${columns.join(', ')} WHERE teacher_id = ?`, values);
    }

    if (subjectIdsProvided) {
      await validateSubjectIds(connection, subjectIds, clientIdForSubjects);
      await replaceTeacherSubjects(connection, req.params.teacherId, subjectIds, clientIdForSubjects);
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
        message: error.message
      });
    }

    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

async function deleteTeacher(req, res) {
  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    const [teacherRows] = await connection.query(
      `SELECT teacher_id FROM ${teachersTable} WHERE teacher_id = ? LIMIT 1`,
      [req.params.teacherId]
    );

    if (!teacherRows.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    const [[usage]] = await connection.query(
      `
        SELECT
          (SELECT COUNT(*) FROM ${teacherSubjectAssignmentsTable} WHERE teacher_id = ?) AS assignment_count,
          (SELECT COUNT(*) FROM ${classScheduleTable} WHERE teacher_id = ?) AS schedule_count,
          (SELECT COUNT(*) FROM ${classroomSessionsTable} WHERE teacher_id = ?) AS session_count
      `,
      [req.params.teacherId, req.params.teacherId, req.params.teacherId]
    );

    const isUsed = Number(usage.assignment_count) > 0 || Number(usage.schedule_count) > 0 || Number(usage.session_count) > 0;

    if (isUsed) {
      await connection.query(
        `UPDATE ${teachersTable} SET employment_status = 'Inactive' WHERE teacher_id = ?`,
        [req.params.teacherId]
      );
      await connection.commit();

      return res.status(200).json({
        success: true,
        message: 'Teacher marked as inactive because records exist.'
      });
    }

    await connection.query(`DELETE FROM ${teacherSubjectsTable} WHERE teacher_id = ?`, [req.params.teacherId]);
    await connection.query(`DELETE FROM ${teachersTable} WHERE teacher_id = ?`, [req.params.teacherId]);

    await connection.commit();
    return res.status(200).json({
      success: true,
      message: 'Teacher deleted successfully'
    });
  } catch (error) {
    await connection.rollback();
    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

function getTeachersBySubject(req, res) {
  const subjectId = normalizePositiveInteger(req.query.subject_id || req.query.subjectId);
  const clientId = normalizePositiveInteger(req.query.client_id || req.query.clientId);

  if (!subjectId) {
    return res.status(400).json({
      success: false,
      message: 'Subject id is required'
    });
  }

  const conditions = [
    'ts.subject_id = ?',
    "t.employment_status = 'Active'"
  ];
  const values = [subjectId];

  if (clientId) {
    conditions.push('t.client_id = ?');
    values.push(clientId);
  }

  const sql = `
    SELECT
      t.teacher_id,
      TRIM(CONCAT_WS(' ', t.first_name, t.middle_name, t.last_name)) AS teacher_name,
      t.email,
      t.phone_number
    FROM ${teachersTable} t
    JOIN ${teacherSubjectsTable} ts ON ts.teacher_id = t.teacher_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY teacher_name ASC
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

function getSubjectsGroupedByClass(req, res) {
  const clientId = normalizePositiveInteger(req.query.client_id || req.query.clientId);

  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'Client id is required'
    });
  }

  const sql = `
    SELECT
      c.classroom_id,
      c.name AS class_name,
      s.subject_id,
      s.sub_name
    FROM ${subjectsTable} s
    LEFT JOIN ${classroomsTable} c
      ON c.classroom_id = s.classroom_id
    WHERE s.client_id = ?
    ORDER BY c.name, s.sub_name
  `;

  pool.query(sql, [clientId], (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    const grouped = [];

    results.forEach((row) => {
      let classGroup = grouped.find(
        item => item.classroom_id === row.classroom_id
      );

      if (!classGroup) {
        classGroup = {
          classroom_id: row.classroom_id,
          class_name: row.class_name || 'General',
          subjects: []
        };

        grouped.push(classGroup);
      }

      classGroup.subjects.push({
        subject_id: row.subject_id,
        sub_name: row.sub_name
      });
    });

    return res.status(200).json({
      success: true,
      data: grouped
    });
  });
}

module.exports = {
  getTeachers,
  getTeacherById,
  getTeachersBySubject,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getSubjectsGroupedByClass
};
