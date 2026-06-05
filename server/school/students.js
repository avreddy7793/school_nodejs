const { pool } = require('../config');
const crypto = require('crypto');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || process.env.DB_DATABASE || 'school';
const studentsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('students')}`;
const classroomsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('classrooms')}`;
const sectionsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('sections')}`;
const userEntityLinksTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('user_entity_links')}`;
const parentStudentLinksTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('parent_student_links')}`;
const loginTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('login')}`;
const rolesTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('roles')}`;
const clientMasterTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('client_master')}`;

const selectableColumns = `
  s.student_id,
  s.client_id,
  s.yearly_fee,
  s.admission_number,
  s.first_name,
  s.middle_name,
  s.last_name,
  s.class_name,
  c.name AS class_display_name,
  s.date_of_birth,
  s.gender,
  s.blood_group,
  s.nationality,
  s.religion,
  s.transport_id,
  s.pickupPoint,
  s.address_line1,
  s.address_line2,
  s.city,
  s.state,
  s.postal_code,
  s.country,
  s.phone_number,
  s.alternate_phone,
  s.email,
  s.emergency_contact_name,
  s.emergency_contact_relation,
  s.emergency_contact_number,
  s.admission_date,
  s.enrollment_status,
  s.grade_level,
  s.section,
  s.roll_number,
  s.academic_year,
  s.father_name,
  s.father_occupation,
  s.father_contact,
  s.mother_name,
  s.mother_occupation,
  s.mother_contact,
  s.guardian_name,
  s.guardian_relation,
  s.guardian_contact,
  s.current_grade,
  s.previous_school,
  s.marks_obtained,
  s.allergies,
  s.medical_conditions,
  s.vaccination_status,
  s.total_days_present,
  s.total_days_absent,
  s.club_membership,
  s.sports_participation,
  s.achievements,
  s.created_at,
  s.updated_at,
  s.created_by,
  s.updated_by
`;

function escapeIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``;
}

const fieldMap = {
  clientId: 'client_id',
  yearlyFee: 'yearly_fee',
  admissionNumber: 'admission_number',
  firstName: 'first_name',
  middleName: 'middle_name',
  lastName: 'last_name',
  className: 'class_name',
  dateOfBirth: 'date_of_birth',
  gender: 'gender',
  bloodGroup: 'blood_group',
  nationality: 'nationality',
  religion: 'religion',
  transportId: 'transport_id',
  pickupPoint: 'pickupPoint',
  addressLine1: 'address_line1',
  addressLine2: 'address_line2',
  city: 'city',
  state: 'state',
  postalCode: 'postal_code',
  country: 'country',
  phoneNumber: 'phone_number',
  alternatePhone: 'alternate_phone',
  email: 'email',
  emergencyContactName: 'emergency_contact_name',
  emergencyContactRelation: 'emergency_contact_relation',
  emergencyContactNumber: 'emergency_contact_number',
  admissionDate: 'admission_date',
  enrollmentStatus: 'enrollment_status',
  gradeLevel: 'grade_level',
  section: 'section',
  rollNumber: 'roll_number',
  academicYear: 'academic_year',
  fatherName: 'father_name',
  fatherOccupation: 'father_occupation',
  fatherContact: 'father_contact',
  motherName: 'mother_name',
  motherOccupation: 'mother_occupation',
  motherContact: 'mother_contact',
  guardianName: 'guardian_name',
  guardianRelation: 'guardian_relation',
  guardianContact: 'guardian_contact',
  currentGrade: 'current_grade',
  previousSchool: 'previous_school',
  marksObtained: 'marks_obtained',
  allergies: 'allergies',
  medicalConditions: 'medical_conditions',
  vaccinationStatus: 'vaccination_status',
  totalDaysPresent: 'total_days_present',
  totalDaysAbsent: 'total_days_absent',
  clubMembership: 'club_membership',
  sportsParticipation: 'sports_participation',
  achievements: 'achievements',
  createdBy: 'created_by',
  updatedBy: 'updated_by'
};

function today() {
  return new Date().toISOString().split('T')[0];
}

function normalizeText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed || null;
}

function normalizePositiveInteger(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
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

function buildTemporaryPassword(studentId, phoneNumber) {
  const phoneSuffix = String(phoneNumber || '').replace(/\D/g, '').slice(-4);
  const suffix = phoneSuffix || String(Math.floor(Math.random() * 9000) + 1000);
  return `Parent@${studentId}${suffix}`;
}

function buildStudentTemporaryPassword(studentId, loginId) {
  const suffix = String(loginId || '').replace(/\D/g, '').slice(-4) || String(Math.floor(Math.random() * 9000) + 1000);
  return `Student@${studentId}${suffix}`;
}

function buildStudentName(payload) {
  return [payload.first_name, payload.middle_name, payload.last_name]
    .filter(Boolean)
    .join(' ');
}

function isParentLogin(login) {
  const values = [login.login_type, login.role_name].map((value) => String(value || '').trim().toUpperCase());
  return values.some((value) => ['PARENT', 'GUARDIAN', 'FATHER', 'MOTHER'].includes(value));
}

function isStudentLogin(login) {
  const values = [login.login_type, login.role_name].map((value) => String(value || '').trim().toUpperCase());
  return values.includes('STUDENT');
}

function getValue(body, camelKey, fallback = null) {
  const snakeKey = fieldMap[camelKey];
  if (body[camelKey] !== undefined) {
    return body[camelKey];
  }
  if (snakeKey && body[snakeKey] !== undefined) {
    return body[snakeKey];
  }
  return fallback;
}

function buildStudentPayload(body) {
  return {
    client_id: getValue(body, 'clientId'),
    yearly_fee: getValue(body, 'yearlyFee'),
    admission_number: getValue(body, 'admissionNumber'),
    first_name: getValue(body, 'firstName'),
    middle_name: getValue(body, 'middleName'),
    last_name: getValue(body, 'lastName'),
    class_name: getValue(body, 'className'),
    date_of_birth: getValue(body, 'dateOfBirth', today()),
    gender: getValue(body, 'gender', 'Other'),
    blood_group: getValue(body, 'bloodGroup'),
    nationality: getValue(body, 'nationality'),
    religion: getValue(body, 'religion'),
    transport_id: getValue(body, 'transportId'),
    pickupPoint: getValue(body, 'pickupPoint'),
    address_line1: getValue(body, 'addressLine1', body.address || null),
    address_line2: getValue(body, 'addressLine2'),
    city: getValue(body, 'city'),
    state: getValue(body, 'state'),
    postal_code: getValue(body, 'postalCode'),
    country: getValue(body, 'country'),
    phone_number: getValue(body, 'phoneNumber', body.phone || null),
    alternate_phone: getValue(body, 'alternatePhone'),
    email: getValue(body, 'email'),
    emergency_contact_name: getValue(body, 'emergencyContactName', body.guardianName || null),
    emergency_contact_relation: getValue(body, 'emergencyContactRelation'),
    emergency_contact_number: getValue(body, 'emergencyContactNumber', body.phone || null),
    admission_date: getValue(body, 'admissionDate', today()),
    enrollment_status: getValue(body, 'enrollmentStatus', 'Active'),
    grade_level: getValue(body, 'gradeLevel', body.grade || null),
    section: getValue(body, 'section'),
    roll_number: getValue(body, 'rollNumber'),
    academic_year: getValue(body, 'academicYear'),
    father_name: getValue(body, 'fatherName'),
    father_occupation: getValue(body, 'fatherOccupation', body.parentOccupation || null),
    father_contact: getValue(body, 'fatherContact', body.parentPhone || null),
    mother_name: getValue(body, 'motherName'),
    mother_occupation: getValue(body, 'motherOccupation'),
    mother_contact: getValue(body, 'motherContact'),
    guardian_name: getValue(body, 'guardianName'),
    guardian_relation: getValue(body, 'guardianRelation'),
    guardian_contact: getValue(body, 'guardianContact', body.parentPhone || body.phone || null),
    current_grade: getValue(body, 'currentGrade', body.grade || null),
    previous_school: getValue(body, 'previousSchool'),
    marks_obtained: getValue(body, 'marksObtained'),
    allergies: getValue(body, 'allergies'),
    medical_conditions: getValue(body, 'medicalConditions'),
    vaccination_status: getValue(body, 'vaccinationStatus'),
    total_days_present: getValue(body, 'totalDaysPresent', 0),
    total_days_absent: getValue(body, 'totalDaysAbsent', 0),
    club_membership: getValue(body, 'clubMembership'),
    sports_participation: getValue(body, 'sportsParticipation'),
    achievements: getValue(body, 'achievements'),
    created_by: getValue(body, 'createdBy'),
    updated_by: getValue(body, 'updatedBy')
  };
}

function normalizeAdmissionPart(value, fallback) {
  const normalized = normalizeText(value) || fallback;
  return String(normalized)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 16) || fallback;
}

function currentAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startYear = month >= 4 ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

async function getClassroomName(connection, classroomId) {
  if (!classroomId) {
    return null;
  }

  const [rows] = await connection.query(
    `SELECT name FROM ${classroomsTable} WHERE classroom_id = ? LIMIT 1`,
    [classroomId]
  );

  return rows[0]?.name || null;
}

async function getSectionMetadata(connection) {
  const [columns] = await connection.query(`SHOW COLUMNS FROM ${sectionsTable}`);
  const columnNames = new Set(columns.map((column) => column.Field));
  return {
    names: columnNames,
    nameColumn: ['name', 'section_name', 'section', 'label'].find((column) => columnNames.has(column)) || null
  };
}

async function validateClassAndSection(connection, payload) {
  const classroomId = normalizePositiveInteger(payload.class_name);
  const sectionName = normalizeText(payload.section);

  if (!classroomId) {
    const error = new Error('Class is required.');
    error.code = 'STUDENT_VALIDATION';
    throw error;
  }

  const [classrooms] = await connection.query(
    `SELECT classroom_id, name FROM ${classroomsTable} WHERE classroom_id = ? AND (? IS NULL OR client_id = ?) LIMIT 1`,
    [classroomId, payload.client_id || null, payload.client_id || null]
  );

  if (!classrooms.length) {
    const error = new Error('Selected class does not exist.');
    error.code = 'STUDENT_VALIDATION';
    throw error;
  }

  payload.class_name = classroomId;
  payload.grade_level = payload.grade_level || classrooms[0].name;
  payload.current_grade = payload.current_grade || classrooms[0].name;

  if (!sectionName) {
    const error = new Error('Section is required.');
    error.code = 'STUDENT_VALIDATION';
    throw error;
  }

  const sectionMeta = await getSectionMetadata(connection);
  const sectionNameColumn = sectionMeta.nameColumn;
  if (!sectionNameColumn) {
    const error = new Error('Sections table must have a name, section_name, section, or label column.');
    error.code = 'STUDENT_VALIDATION';
    throw error;
  }

  const sectionWhere = [`LOWER(${escapeIdentifier(sectionNameColumn)}) = LOWER(?)`];
  const sectionValues = [sectionName];

  if (sectionMeta.names.has('classroom_id')) {
    sectionWhere.unshift('classroom_id = ?');
    sectionValues.unshift(classroomId);
  }

  if (sectionMeta.names.has('client_id')) {
    sectionWhere.push('(? IS NULL OR client_id = ?)');
    sectionValues.push(payload.client_id || null, payload.client_id || null);
  }

  if (sectionMeta.names.has('status')) {
    sectionWhere.push("(status IS NULL OR status = 'Active')");
  }

  const [sections] = await connection.query(
    `
      SELECT 1 AS found
      FROM ${sectionsTable}
      WHERE ${sectionWhere.join(' AND ')}
      LIMIT 1
    `,
    sectionValues
  );

  if (!sections.length) {
    const error = new Error('Selected section does not belong to this class.');
    error.code = 'STUDENT_VALIDATION';
    throw error;
  }
}

async function generateStudentAdmissionIdentity(connection, payload) {
  const classroomId = normalizePositiveInteger(payload.class_name);
  const academicYear = normalizeText(payload.academic_year) || currentAcademicYear();
  const section = normalizeText(payload.section);
  const classroomName = await getClassroomName(connection, classroomId);
  const yearPart = normalizeAdmissionPart(academicYear, 'YEAR');
  const classPart = normalizeAdmissionPart(classroomName || classroomId, 'CLASS');
  const sectionPart = normalizeAdmissionPart(section, 'SEC');

  const [rollRows] = await connection.query(
    `
      SELECT MAX(COALESCE(roll_number, 0)) AS max_roll
      FROM ${studentsTable}
      WHERE (? IS NULL OR client_id = ?)
        AND class_name = ?
        AND section = ?
        AND academic_year = ?
    `,
    [payload.client_id || null, payload.client_id || null, classroomId, section, academicYear]
  );

  let serial = Number(rollRows[0]?.max_roll || 0) + 1;
  let admissionNumber = '';

  while (serial < 10000) {
    admissionNumber = `${yearPart}-${classPart}-${sectionPart}-${String(serial).padStart(3, '0')}`;
    const [existingRows] = await connection.query(
      `SELECT student_id FROM ${studentsTable} WHERE admission_number = ? LIMIT 1`,
      [admissionNumber]
    );

    if (!existingRows.length) {
      return {
        admissionNumber,
        rollNumber: serial,
        academicYear
      };
    }

    serial += 1;
  }

  const error = new Error('Unable to generate a unique admission number for this class and section.');
  error.code = 'STUDENT_VALIDATION';
  throw error;
}

async function tableColumnExists(connection, tableName, columnName) {
  const [rows] = await connection.query(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [schoolDatabase, tableName, columnName]
  );

  return rows.length > 0;
}

async function countStudentReferences(connection, studentId) {
  const referenceTables = [
    'exam_results',
    'student_attendance',
    'attendance',
    'fee_records',
    'student_room_assignments',
    'hostel_payments',
    'unit_test_results'
  ];
  let total = 0;

  for (const tableName of referenceTables) {
    const hasStudentId = await tableColumnExists(connection, tableName, 'student_id');
    if (!hasStudentId) {
      continue;
    }

    const [rows] = await connection.query(
      `SELECT COUNT(*) AS count FROM ${escapeIdentifier(schoolDatabase)}.${escapeIdentifier(tableName)} WHERE student_id = ?`,
      [studentId]
    );
    total += Number(rows[0]?.count || 0);
  }

  return total;
}

function buildParentLoginOptions(body, payload) {
  return {
    createLogin: normalizeBoolean(getValue(body, 'createParentLogin'), true),
    loginId: normalizeText(getValue(body, 'parentLoginId'))
      || normalizeText(payload.guardian_contact)
      || normalizeText(payload.father_contact)
      || normalizeText(payload.mother_contact)
      || normalizeText(payload.email)
      || normalizeText(payload.phone_number),
    loginPassword: normalizeText(getValue(body, 'parentLoginPassword')),
    relationship: normalizeText(payload.guardian_relation) || 'PARENT'
  };
}

function buildStudentLoginOptions(body, payload) {
  return {
    createLogin: normalizeBoolean(getValue(body, 'createStudentLogin'), false),
    loginId: normalizeText(getValue(body, 'studentLoginEmail'))
      || normalizeText(payload.email)
      || normalizeText(payload.admission_number),
    loginPassword: normalizeText(getValue(body, 'studentLoginPassword'))
  };
}

function buildStudentUpdatePayload(body) {
  const payload = {};

  Object.entries(fieldMap).forEach(([camelKey, column]) => {
    if (body[camelKey] !== undefined) {
      payload[column] = body[camelKey];
    } else if (body[column] !== undefined) {
      payload[column] = body[column];
    }
  });

  if (body.address !== undefined) {
    payload.address_line1 = body.address;
  }
  if (body.phone !== undefined) {
    payload.phone_number = body.phone;
    payload.emergency_contact_number = body.phone;
  }
  if (body.grade !== undefined) {
    payload.grade_level = body.grade;
    payload.current_grade = body.grade;
  }
  if (body.parentOccupation !== undefined) {
    payload.father_occupation = body.parentOccupation;
  }
  if (body.parentPhone !== undefined) {
    payload.father_contact = body.parentPhone;
    payload.guardian_contact = body.parentPhone;
  }

  return payload;
}

function sendDatabaseError(res, error) {
  return res.status(500).json({
    success: false,
    message: 'Database error',
    error: error.message
  });
}

async function ensurePortalLinkTables(connection) {
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

  await connection.query(`
    CREATE TABLE IF NOT EXISTS ${parentStudentLinksTable} (
      id int NOT NULL AUTO_INCREMENT,
      client_id bigint NOT NULL,
      parent_login_id int NOT NULL,
      student_id int NOT NULL,
      relationship varchar(50) DEFAULT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
}

async function getClientCategoryId(connection, clientId) {
  const [rows] = await connection.query(`SELECT category FROM ${clientMasterTable} WHERE client_id = ?`, [clientId]);
  return rows[0]?.category || null;
}

async function getOrCreateParentRole(connection, clientId) {
  const [roles] = await connection.query(`
    SELECT id
    FROM ${rolesTable}
    WHERE UPPER(role_name) = 'PARENT'
      AND (client_id = ? OR client_id IS NULL)
    ORDER BY CASE WHEN client_id = ? THEN 0 ELSE 1 END
    LIMIT 1
  `, [clientId, clientId]);

  if (roles.length) {
    return roles[0].id;
  }

  const [result] = await connection.query(
    `INSERT INTO ${rolesTable} (client_id, role_name, navbar) VALUES (?, 'PARENT', ?)`,
    [clientId, JSON.stringify({ navbar: [] })]
  );

  return result.insertId;
}

async function getOrCreateStudentRole(connection, clientId) {
  const [roles] = await connection.query(`
    SELECT id
    FROM ${rolesTable}
    WHERE UPPER(role_name) = 'STUDENT'
      AND (client_id = ? OR client_id IS NULL)
    ORDER BY CASE WHEN client_id = ? THEN 0 ELSE 1 END
    LIMIT 1
  `, [clientId, clientId]);

  if (roles.length) {
    return roles[0].id;
  }

  const [result] = await connection.query(
    `INSERT INTO ${rolesTable} (client_id, role_name, navbar) VALUES (?, 'STUDENT', ?)`,
    [clientId, JSON.stringify({ navbar: [] })]
  );

  return result.insertId;
}

async function linkParentToStudent(connection, clientId, loginId, studentId, relationship) {
  await ensurePortalLinkTables(connection);

  const [entityLinks] = await connection.query(`
    SELECT link_id
    FROM ${userEntityLinksTable}
    WHERE client_id = ?
      AND login_id = ?
      AND entity_type = 'PARENT'
      AND entity_id = ?
    LIMIT 1
  `, [clientId, loginId, studentId]);

  if (!entityLinks.length) {
    await connection.query(`INSERT INTO ${userEntityLinksTable} SET ?`, {
      client_id: clientId,
      login_id: loginId,
      entity_type: 'PARENT',
      entity_id: studentId,
      relationship,
      status: 'ACTIVE'
    });
  }

  const [parentLinks] = await connection.query(`
    SELECT id
    FROM ${parentStudentLinksTable}
    WHERE client_id = ?
      AND parent_login_id = ?
      AND student_id = ?
    LIMIT 1
  `, [clientId, loginId, studentId]);

  if (!parentLinks.length) {
    await connection.query(`INSERT INTO ${parentStudentLinksTable} SET ?`, {
      client_id: clientId,
      parent_login_id: loginId,
      student_id: studentId,
      relationship
    });
  }
}

async function linkStudentLogin(connection, clientId, loginId, studentId) {
  await ensurePortalLinkTables(connection);

  const [entityLinks] = await connection.query(`
    SELECT link_id
    FROM ${userEntityLinksTable}
    WHERE client_id = ?
      AND login_id = ?
      AND entity_type = 'STUDENT'
      AND entity_id = ?
    LIMIT 1
  `, [clientId, loginId, studentId]);

  if (!entityLinks.length) {
    await connection.query(`INSERT INTO ${userEntityLinksTable} SET ?`, {
      client_id: clientId,
      login_id: loginId,
      entity_type: 'STUDENT',
      entity_id: studentId,
      relationship: 'SELF',
      status: 'ACTIVE'
    });
  }
}

async function createParentLogin(connection, payload, studentId, loginOptions) {
  if (!loginOptions.createLogin) {
    return null;
  }

  if (!loginOptions.loginId) {
    const error = new Error('Parent login phone or email is required');
    error.code = 'PARENT_LOGIN_REQUIRED';
    throw error;
  }

  const [existingLogins] = await connection.query(`
    SELECT l.login_id, l.client_id, l.login_type, r.role_name
    FROM ${loginTable} l
    LEFT JOIN ${rolesTable} r ON r.id = l.role
    WHERE l.login_email = ?
    LIMIT 1
  `, [loginOptions.loginId]);

  if (existingLogins.length) {
    const existingLogin = existingLogins[0];

    if (Number(existingLogin.client_id) !== Number(payload.client_id) || !isParentLogin(existingLogin)) {
      const error = new Error('A non-parent login already exists with this phone or email');
      error.code = 'PARENT_LOGIN_EXISTS';
      throw error;
    }

    await linkParentToStudent(connection, payload.client_id, existingLogin.login_id, studentId, loginOptions.relationship);
    return {
      login_id: existingLogin.login_id,
      login_email: loginOptions.loginId,
      temporary_password: null,
      role: 'PARENT',
      existing: true
    };
  }

  const password = loginOptions.loginPassword || buildTemporaryPassword(studentId, loginOptions.loginId);
  const passwordHash = hashPassword(password);
  const roleId = await getOrCreateParentRole(connection, payload.client_id);
  const categoryId = await getClientCategoryId(connection, payload.client_id);

  const loginPayload = {
    login_email: loginOptions.loginId,
    passkey: passwordHash.passkey,
    salt: passwordHash.salt,
    login_name: payload.guardian_name || payload.father_name || payload.mother_name || `Parent of ${buildStudentName(payload)}`,
    login_designation: 'Parent',
    login_type: 'PARENT',
    client_id: payload.client_id,
    created_by: null,
    emp_id: null,
    status: 'ACTIVATED',
    category: categoryId,
    role: roleId,
    password: null,
    branch_id: null
  };

  const [loginResult] = await connection.query(`INSERT INTO ${loginTable} SET ?`, loginPayload);
  await linkParentToStudent(connection, payload.client_id, loginResult.insertId, studentId, loginOptions.relationship);

  return {
    login_id: loginResult.insertId,
    login_email: loginOptions.loginId,
    temporary_password: password,
    role: 'PARENT',
    existing: false
  };
}

async function createStudentLogin(connection, payload, studentId, loginOptions) {
  if (!loginOptions.createLogin) {
    return null;
  }

  if (!loginOptions.loginId) {
    const error = new Error('Student login email is required');
    error.code = 'STUDENT_LOGIN_REQUIRED';
    throw error;
  }

  const [existingLogins] = await connection.query(`
    SELECT l.login_id, l.client_id, l.login_type, r.role_name
    FROM ${loginTable} l
    LEFT JOIN ${rolesTable} r ON r.id = l.role
    WHERE l.login_email = ?
    LIMIT 1
  `, [loginOptions.loginId]);

  if (existingLogins.length) {
    const existingLogin = existingLogins[0];

    if (Number(existingLogin.client_id) !== Number(payload.client_id) || !isStudentLogin(existingLogin)) {
      const error = new Error('A non-student login already exists with this email');
      error.code = 'STUDENT_LOGIN_EXISTS';
      throw error;
    }

    let temporaryPassword = null;
    if (loginOptions.loginPassword) {
      const passwordHash = hashPassword(loginOptions.loginPassword);
      await connection.query(
        `UPDATE ${loginTable} SET passkey = ?, salt = ?, status = 'ACTIVATED' WHERE login_id = ?`,
        [passwordHash.passkey, passwordHash.salt, existingLogin.login_id]
      );
      temporaryPassword = loginOptions.loginPassword;
    }

    await linkStudentLogin(connection, payload.client_id, existingLogin.login_id, studentId);
    return {
      login_id: existingLogin.login_id,
      login_email: loginOptions.loginId,
      temporary_password: temporaryPassword,
      role: 'STUDENT',
      existing: true
    };
  }

  const password = loginOptions.loginPassword || buildStudentTemporaryPassword(studentId, loginOptions.loginId);
  const passwordHash = hashPassword(password);
  const roleId = await getOrCreateStudentRole(connection, payload.client_id);
  const categoryId = await getClientCategoryId(connection, payload.client_id);

  const loginPayload = {
    login_email: loginOptions.loginId,
    passkey: passwordHash.passkey,
    salt: passwordHash.salt,
    login_name: buildStudentName(payload) || `Student ${studentId}`,
    login_designation: 'Student',
    login_type: 'STUDENT',
    client_id: payload.client_id,
    created_by: null,
    emp_id: null,
    status: 'ACTIVATED',
    category: categoryId,
    role: roleId,
    password: null,
    branch_id: null
  };

  const [loginResult] = await connection.query(`INSERT INTO ${loginTable} SET ?`, loginPayload);
  await linkStudentLogin(connection, payload.client_id, loginResult.insertId, studentId);

  return {
    login_id: loginResult.insertId,
    login_email: loginOptions.loginId,
    temporary_password: password,
    role: 'STUDENT',
    existing: false
  };
}

async function getNextAdmissionNumber(req, res) {
  const connection = await pool.promise().getConnection();

  try {
    const payload = {
      client_id: normalizePositiveInteger(req.query.client_id || req.query.clientId),
      class_name: normalizePositiveInteger(req.query.classroom_id || req.query.className || req.query.class_name),
      section: normalizeText(req.query.section),
      academic_year: normalizeText(req.query.academic_year || req.query.academicYear) || currentAcademicYear()
    };

    if (!payload.class_name || !payload.section) {
      return res.status(200).json({
        success: true,
        admissionNumber: '',
        rollNumber: null,
        academicYear: payload.academic_year,
        message: 'Select class and section to generate admission number.'
      });
    }

    await validateClassAndSection(connection, payload);
    const identity = await generateStudentAdmissionIdentity(connection, payload);

    return res.status(200).json({
      success: true,
      admissionNumber: identity.admissionNumber,
      rollNumber: identity.rollNumber,
      academicYear: identity.academicYear
    });
  } catch (error) {
    if (error.code === 'STUDENT_VALIDATION') {
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

function getStudents(req, res) {
  const { client_id, grade, section, search } = req.query;
  const classroomId = normalizePositiveInteger(req.query.classroom_id || req.query.className || req.query.class_name);
  const conditions = [];
  const values = [];

  if (client_id) {
    conditions.push('s.client_id = ?');
    values.push(client_id);
  }

  if (classroomId) {
    conditions.push('s.class_name = ?');
    values.push(classroomId);
  }

  if (grade) {
    conditions.push('s.grade_level = ?');
    values.push(grade);
  }

  if (section) {
    conditions.push('s.section = ?');
    values.push(section);
  }

  if (search) {
    conditions.push('(s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ? OR s.email LIKE ? OR c.name LIKE ?)');
    const searchValue = `%${search}%`;
    values.push(searchValue, searchValue, searchValue, searchValue, searchValue);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT ${selectableColumns}
    FROM ${studentsTable} s
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = s.class_name
    ${whereClause}
    ORDER BY s.updated_at DESC
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

function getStudentById(req, res) {
  const sql = `
    SELECT ${selectableColumns}
    FROM ${studentsTable} s
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = s.class_name
    WHERE s.student_id = ?
  `;

  pool.query(sql, [req.params.studentId], (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: results[0]
    });
  });
}

async function createStudent(req, res) {
  const payload = buildStudentPayload(req.body);
  const parentLoginOptions = buildParentLoginOptions(req.body, payload);
  const studentLoginOptions = buildStudentLoginOptions(req.body, payload);

  if (!payload.first_name || !payload.last_name || !payload.date_of_birth || !payload.gender || !payload.admission_date || !payload.enrollment_status) {
    return res.status(400).json({
      success: false,
      message: 'First name, last name, date of birth, gender, admission date, and enrollment status are required'
    });
  }

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    await validateClassAndSection(connection, payload);

    if (!payload.academic_year) {
      payload.academic_year = currentAcademicYear();
    }

    const identity = await generateStudentAdmissionIdentity(connection, payload);
    payload.admission_number = identity.admissionNumber;
    payload.roll_number = identity.rollNumber;
    payload.academic_year = identity.academicYear;

    const [result] = await connection.query(`INSERT INTO ${studentsTable} SET ?`, payload);
    const parentLogin = await createParentLogin(connection, payload, result.insertId, parentLoginOptions);
    const studentLogin = await createStudentLogin(connection, payload, result.insertId, studentLoginOptions);

    await connection.commit();
    const loginMessage = [parentLogin ? 'parent portal login' : '', studentLogin ? 'student portal login' : ''].filter(Boolean).join(' and ');
    return res.status(201).json({
      success: true,
      message: loginMessage ? `Student created successfully with ${loginMessage}` : 'Student created successfully',
      student_id: result.insertId,
      admission_number: payload.admission_number,
      parent_login: parentLogin,
      student_login: studentLogin,
      parentLogins: parentLogin ? [parentLogin] : [],
      studentLogins: studentLogin ? [studentLogin] : []
    });
  } catch (error) {
    await connection.rollback();

    if (error.code === 'PARENT_LOGIN_EXISTS') {
      return res.status(409).json({
        success: false,
        message: 'A non-parent login already exists with this phone or email. Use another parent login ID.'
      });
    }

    if (error.code === 'PARENT_LOGIN_REQUIRED') {
      return res.status(400).json({
        success: false,
        message: 'Parent login phone or email is required'
      });
    }

    if (error.code === 'STUDENT_LOGIN_EXISTS') {
      return res.status(409).json({
        success: false,
        message: 'A non-student login already exists with this email. Use another student login email.'
      });
    }

    if (error.code === 'STUDENT_LOGIN_REQUIRED') {
      return res.status(400).json({
        success: false,
        message: 'Student login email is required'
      });
    }

    if (error.code === 'STUDENT_VALIDATION') {
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

async function updateStudent(req, res) {
  const payload = buildStudentUpdatePayload(req.body);
  const studentLoginRequested = normalizeBoolean(getValue(req.body, 'createStudentLogin'), false);
  delete payload.created_by;

  const updates = Object.entries(payload).filter(([, value]) => value !== undefined);
  if (!updates.length) {
    return res.status(400).json({
      success: false,
      message: 'No update data supplied'
    });
  }

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query(
      `SELECT * FROM ${studentsTable} WHERE student_id = ? LIMIT 1`,
      [req.params.studentId]
    );

    if (!existingRows.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const mergedPayload = {
      ...existingRows[0],
      ...payload
    };
    const studentLoginOptions = buildStudentLoginOptions(req.body, mergedPayload);

    await validateClassAndSection(connection, mergedPayload);

    const columns = updates.map(([key]) => `${key} = ?`);
    const values = updates.map(([, value]) => value);
    values.push(req.params.studentId);

    await connection.query(`UPDATE ${studentsTable} SET ${columns.join(', ')} WHERE student_id = ?`, values);
    const studentLogin = studentLoginRequested
      ? await createStudentLogin(connection, mergedPayload, Number(req.params.studentId), studentLoginOptions)
      : null;
    await connection.commit();

    return res.status(200).json({
      success: true,
      message: studentLogin ? 'Student updated successfully with student portal login' : 'Student updated successfully',
      student_login: studentLogin,
      studentLogins: studentLogin ? [studentLogin] : []
    });
  } catch (error) {
    await connection.rollback();

    if (error.code === 'STUDENT_VALIDATION') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.code === 'STUDENT_LOGIN_EXISTS') {
      return res.status(409).json({
        success: false,
        message: 'A non-student login already exists with this email. Use another student login email.'
      });
    }

    if (error.code === 'STUDENT_LOGIN_REQUIRED') {
      return res.status(400).json({
        success: false,
        message: 'Student login email is required'
      });
    }

    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

async function deactivateStudent(req, res) {
  const connection = await pool.promise().getConnection();

  try {
    const [result] = await connection.query(
      `UPDATE ${studentsTable} SET enrollment_status = 'Inactive' WHERE student_id = ?`,
      [req.params.studentId]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student deactivated successfully'
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

async function deleteStudent(req, res) {
  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    const [studentRows] = await connection.query(
      `SELECT student_id FROM ${studentsTable} WHERE student_id = ? LIMIT 1`,
      [req.params.studentId]
    );

    if (!studentRows.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const referenceCount = await countStudentReferences(connection, req.params.studentId);
    if (referenceCount > 0) {
      await connection.query(
        `UPDATE ${studentsTable} SET enrollment_status = 'Inactive' WHERE student_id = ?`,
        [req.params.studentId]
      );
      await connection.commit();

      return res.status(200).json({
        success: true,
        message: 'Student marked inactive because related records exist.'
      });
    }

    if (await tableColumnExists(connection, 'parent_student_links', 'student_id')) {
      await connection.query(
        `DELETE FROM ${parentStudentLinksTable} WHERE student_id = ?`,
        [req.params.studentId]
      );
    }

    if (await tableColumnExists(connection, 'user_entity_links', 'entity_id')) {
      await connection.query(
        `DELETE FROM ${userEntityLinksTable} WHERE entity_type IN ('STUDENT', 'PARENT') AND entity_id = ?`,
        [req.params.studentId]
      );
    }
    await connection.query(`DELETE FROM ${studentsTable} WHERE student_id = ?`, [req.params.studentId]);
    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    await connection.rollback();
    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

module.exports = {
  getNextAdmissionNumber,
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deactivateStudent,
  deleteStudent
};
