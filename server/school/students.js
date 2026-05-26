const { pool } = require('../config');
const crypto = require('crypto');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const globalDatabase = process.env.DB_GLOBAL_DATABASE || process.env.DB_DATABASE || 'global';
const studentsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('students')}`;
const classroomsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('classrooms')}`;
const userEntityLinksTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('user_entity_links')}`;
const parentStudentLinksTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('parent_student_links')}`;
const loginTable = `${escapeIdentifier(globalDatabase)}.${escapeIdentifier('login')}`;
const rolesTable = `${escapeIdentifier(globalDatabase)}.${escapeIdentifier('roles')}`;
const clientMasterTable = `${escapeIdentifier(globalDatabase)}.${escapeIdentifier('client_master')}`;

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

function buildStudentName(payload) {
  return [payload.first_name, payload.middle_name, payload.last_name]
    .filter(Boolean)
    .join(' ');
}

function isParentLogin(login) {
  const values = [login.login_type, login.role_name].map((value) => String(value || '').trim().toUpperCase());
  return values.some((value) => ['PARENT', 'GUARDIAN', 'FATHER', 'MOTHER'].includes(value));
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
    admission_number: getValue(body, 'admissionNumber', `ADM${Date.now()}`),
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

function getNextAdmissionNumber(req, res) {
  pool.query(`SELECT admission_number FROM ${studentsTable}`, (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    const maxNumber = results.reduce((max, row) => {
      const match = String(row.admission_number || '').match(/(\d+)$/);
      if (!match) {
        return max;
      }

      return Math.max(max, Number(match[1]));
    }, 0);

    const nextNumber = maxNumber + 1;
    const admissionNumber = `ADM${String(nextNumber).padStart(3, '0')}`;

    return res.status(200).json({
      success: true,
      admissionNumber
    });
  });
}

function getStudents(req, res) {
  const { client_id, grade, section, search } = req.query;
  const conditions = [];
  const values = [];

  if (client_id) {
    conditions.push('s.client_id = ?');
    values.push(client_id);
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

  if (!payload.first_name || !payload.last_name) {
    return res.status(400).json({
      success: false,
      message: 'First name and last name are required'
    });
  }

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    if (!payload.admission_number) {
      const [admissionRows] = await connection.query(`SELECT admission_number FROM ${studentsTable}`);
      const maxNumber = admissionRows.reduce((max, row) => {
        const match = String(row.admission_number || '').match(/(\d+)$/);
        return match ? Math.max(max, Number(match[1])) : max;
      }, 0);

      payload.admission_number = `ADM${String(maxNumber + 1).padStart(3, '0')}`;
    }

    const [result] = await connection.query(`INSERT INTO ${studentsTable} SET ?`, payload);
    const parentLogin = await createParentLogin(connection, payload, result.insertId, parentLoginOptions);

    await connection.commit();
    return res.status(201).json({
      success: true,
      message: parentLogin ? 'Student created successfully with parent portal login' : 'Student created successfully',
      student_id: result.insertId,
      admission_number: payload.admission_number,
      parent_login: parentLogin,
      parentLogins: parentLogin ? [parentLogin] : []
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

    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

function updateStudent(req, res) {
  const payload = buildStudentUpdatePayload(req.body);
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
  values.push(req.params.studentId);

  pool.query(`UPDATE ${studentsTable} SET ${columns.join(', ')} WHERE student_id = ?`, values, (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student updated successfully'
    });
  });
}

function deleteStudent(req, res) {
  pool.query(`DELETE FROM ${studentsTable} WHERE student_id = ?`, [req.params.studentId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Student deleted successfully'
    });
  });
}

module.exports = {
  getNextAdmissionNumber,
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};
