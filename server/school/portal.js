const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const db = pool.promise();

const studentsTable = table('students');
const teachersTable = table('teachers');
const classroomsTable = table('classrooms');
const userEntityLinksTable = table('user_entity_links');
const parentStudentLinksTable = table('parent_student_links');
const examResultsTable = table('exam_results');
const examsTable = table('exams');
const subjectsTable = table('subjects');
const studentAttendanceTable = table('student_attendance');
const teacherAttendanceTable = table('teacher_attendance');
const legacyAttendanceTable = table('attendance');
const schedulesTable = table('class_schedule');
const sessionsTable = table('school_sessions');
const periodsTable = table('session_periods');
const feeRecordsTable = table('fee_records');
const transportsTable = table('transports');
const staffTable = table('staff');
const teacherLeavesTable = table('teacher_leaves');
const assignmentsTable = table('student_room_assignments');
const roomsTable = table('hostel_rooms');
const hostelPaymentsTable = table('hostel_payments');

let hostelPaymentsReady = false;
let teacherAttendanceColumns = null;

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

function normalizeRole(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim().toUpperCase().replace(/[-_]+/g, ' ');
}

function isParentOrStudent(decoded) {
  const candidates = [
    normalizeRole(decoded?.role),
    normalizeRole(decoded?.role_name),
    normalizeRole(decoded?.login_type)
  ];

  return candidates.some((value) => ['PARENT', 'GUARDIAN', 'FATHER', 'MOTHER', 'STUDENT'].includes(value));
}

function isTeacher(decoded) {
  const candidates = [
    normalizeRole(decoded?.role),
    normalizeRole(decoded?.role_name),
    normalizeRole(decoded?.login_type),
    normalizeRole(decoded?.entity_type)
  ];

  return candidates.includes('TEACHER');
}

function getDecodedContext(req) {
  const decoded = req.decoded || {};
  return {
    loginId: normalizePositiveInteger(decoded.login_id),
    clientId: normalizePositiveInteger(decoded.client_id || req.query.client_id),
    loginEmail: decoded.login_email ? String(decoded.login_email).trim() : '',
    decoded
  };
}

function emptyStudentPortalPayload(clientId) {
  return {
    portal_type: 'student',
    clientId,
    students: [],
    results: [],
    upcomingExams: [],
    attendance: [],
    fees: [],
    transport: [],
    hostel: { assignments: [], payments: [] },
    totals: {
      students: 0,
      attendance: { total: 0, present: 0, absent: 0, late: 0, leave: 0 },
      fees: { total: 0, paid: 0, due: 0 },
      hostel: { total: 0, paid: 0, due: 0 }
    }
  };
}

function emptyTeacherPortalPayload(clientId) {
  return {
    ...emptyStudentPortalPayload(clientId),
    portal_type: 'teacher',
    teacher: null,
    teacherSchedules: [],
    teacherExams: [],
    teacherAttendance: [],
    teacherLeaves: [],
    teacherTotals: {
      schedules: 0,
      classes: 0,
      upcomingExams: 0,
      attendance: { total: 0, present: 0, absent: 0, late: 0, leave: 0 },
      leaves: { total: 0, pending: 0, approved: 0, rejected: 0 }
    }
  };
}

async function ensureHostelPaymentsTable() {
  if (hostelPaymentsReady) {
    return;
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS ${hostelPaymentsTable} (
      payment_id int NOT NULL AUTO_INCREMENT,
      client_id bigint DEFAULT NULL,
      assignment_id int NOT NULL,
      student_id int NOT NULL,
      room_id int NOT NULL,
      receipt_no varchar(30) NOT NULL,
      payment_date date NOT NULL,
      payment_type varchar(20) DEFAULT 'PARTIAL',
      payment_mode varchar(30) DEFAULT 'Cash',
      amount decimal(10,2) NOT NULL DEFAULT 0.00,
      notes text,
      created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (payment_id),
      UNIQUE KEY receipt_no (receipt_no),
      KEY hostel_payments_client_idx (client_id),
      KEY hostel_payments_assignment_idx (assignment_id),
      KEY hostel_payments_student_idx (student_id),
      KEY hostel_payments_room_idx (room_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
  hostelPaymentsReady = true;
}

async function getTeacherAttendanceColumns() {
  if (teacherAttendanceColumns) {
    return teacherAttendanceColumns;
  }

  const [rows] = await db.query(`SHOW COLUMNS FROM ${teacherAttendanceTable}`);
  teacherAttendanceColumns = new Set(rows.map((row) => row.Field));
  return teacherAttendanceColumns;
}

async function getScopedStudentIds(req) {
  const { loginId, clientId, loginEmail, decoded } = getDecodedContext(req);

  if (!loginId || !clientId) {
    return { clientId, studentIds: [] };
  }

  const [linkedRows] = await db.query(`
    SELECT entity_id AS student_id
    FROM ${userEntityLinksTable}
    WHERE client_id = ?
      AND login_id = ?
      AND entity_type IN ('STUDENT', 'PARENT')
      AND (status IS NULL OR status = 'ACTIVE')
    UNION
    SELECT student_id
    FROM ${parentStudentLinksTable}
    WHERE client_id = ?
      AND parent_login_id = ?
  `, [clientId, loginId, clientId, loginId]);

  const linkedIds = linkedRows
    .map((row) => normalizePositiveInteger(row.student_id))
    .filter(Boolean);

  if (linkedIds.length || !loginEmail || !isParentOrStudent(decoded)) {
    return { clientId, studentIds: [...new Set(linkedIds)] };
  }

  const [matchedRows] = await db.query(`
    SELECT student_id
    FROM ${studentsTable}
    WHERE client_id = ?
      AND (
        email = ?
        OR phone_number = ?
        OR father_contact = ?
        OR mother_contact = ?
        OR guardian_contact = ?
        OR admission_number = ?
      )
  `, [clientId, loginEmail, loginEmail, loginEmail, loginEmail, loginEmail, loginEmail]);

  const matchedIds = matchedRows
    .map((row) => normalizePositiveInteger(row.student_id))
    .filter(Boolean);

  return { clientId, studentIds: [...new Set(matchedIds)] };
}

async function getScopedTeacherId(req) {
  const { loginId, clientId, loginEmail, decoded } = getDecodedContext(req);

  if (!loginId || !clientId || !isTeacher(decoded)) {
    return { clientId, teacherId: null };
  }

  const tokenTeacherId = normalizeRole(decoded.entity_type) === 'TEACHER'
    ? normalizePositiveInteger(decoded.entity_id)
    : null;

  if (tokenTeacherId) {
    return { clientId, teacherId: tokenTeacherId };
  }

  const [linkedRows] = await db.query(`
    SELECT entity_id AS teacher_id
    FROM ${userEntityLinksTable}
    WHERE client_id = ?
      AND login_id = ?
      AND entity_type = 'TEACHER'
      AND (status IS NULL OR status = 'ACTIVE')
    LIMIT 1
  `, [clientId, loginId]);

  const linkedTeacherId = normalizePositiveInteger(linkedRows[0]?.teacher_id);

  if (linkedTeacherId) {
    return { clientId, teacherId: linkedTeacherId };
  }

  if (!loginEmail) {
    return { clientId, teacherId: null };
  }

  const [matchedRows] = await db.query(`
    SELECT teacher_id
    FROM ${teachersTable}
    WHERE client_id = ?
      AND email = ?
    LIMIT 1
  `, [clientId, loginEmail]);

  return {
    clientId,
    teacherId: normalizePositiveInteger(matchedRows[0]?.teacher_id)
  };
}

function filterStudentIds(studentIds, requestedStudentId) {
  const requested = normalizePositiveInteger(requestedStudentId);
  if (!requested) {
    return { allowed: true, studentIds };
  }

  return {
    allowed: studentIds.includes(requested),
    studentIds: studentIds.includes(requested) ? [requested] : []
  };
}

async function fetchStudents(clientId, studentIds) {
  if (!studentIds.length) {
    return [];
  }

  const [rows] = await db.query(`
    SELECT
      s.student_id,
      s.client_id,
      s.yearly_fee,
      s.admission_number,
      CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
      s.first_name,
      s.middle_name,
      s.last_name,
      s.class_name,
      c.classroom_id,
      c.name AS classroom_name,
      c.capacity AS classroom_capacity,
      c.facilities AS classroom_facilities,
      s.gender,
      s.date_of_birth,
      s.email,
      s.phone_number,
      s.grade_level,
      s.section,
      s.roll_number,
      s.academic_year,
      s.enrollment_status,
      s.transport_id,
      s.pickupPoint,
      s.total_days_present,
      s.total_days_absent,
      s.father_name,
      s.father_contact,
      s.mother_name,
      s.mother_contact,
      s.guardian_name,
      s.guardian_relation,
      s.guardian_contact
    FROM ${studentsTable} s
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = s.class_name
    WHERE s.client_id = ?
      AND s.student_id IN (?)
    ORDER BY s.first_name ASC, s.last_name ASC
  `, [clientId, studentIds]);

  return rows;
}

async function fetchResults(clientId, studentIds) {
  if (!studentIds.length) {
    return [];
  }

  const [rows] = await db.query(`
    SELECT
      er.exam_resu_id,
      er.student_id,
      CONCAT_WS(' ', st.first_name, st.middle_name, st.last_name) AS student_name,
      st.admission_number,
      e.exam_id,
      e.exam_date,
      e.total_marks,
      e.passing_marks,
      er.marks_obtained,
      er.status,
      s.sub_name AS subject_name,
      c.name AS classroom_name,
      er.created_at
    FROM ${examResultsTable} er
    INNER JOIN ${examsTable} e ON e.exam_id = er.exam_id
    LEFT JOIN ${subjectsTable} s ON s.subject_id = e.subject_id
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = s.classroom_id
    LEFT JOIN ${studentsTable} st ON st.student_id = er.student_id
    WHERE er.client_id = ?
      AND er.student_id IN (?)
    ORDER BY e.exam_date DESC, er.exam_resu_id DESC
    LIMIT 50
  `, [clientId, studentIds]);

  return rows;
}

async function fetchUpcomingExams(clientId, studentIds) {
  if (!studentIds.length) {
    return [];
  }

  const [rows] = await db.query(`
    SELECT
      st.student_id,
      CONCAT_WS(' ', st.first_name, st.middle_name, st.last_name) AS student_name,
      e.exam_id,
      e.exam_date,
      e.total_marks,
      e.passing_marks,
      e.duration,
      s.sub_name AS subject_name,
      c.name AS classroom_name
    FROM ${studentsTable} st
    INNER JOIN ${subjectsTable} s ON s.classroom_id = st.class_name
      AND s.client_id = st.client_id
    INNER JOIN ${examsTable} e ON e.subject_id = s.subject_id
      AND e.client_id = st.client_id
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = s.classroom_id
    WHERE st.client_id = ?
      AND st.student_id IN (?)
      AND e.exam_date >= CURDATE()
    ORDER BY e.exam_date ASC, e.exam_id ASC
    LIMIT 30
  `, [clientId, studentIds]);

  return rows;
}

async function fetchAttendance(clientId, studentIds) {
  if (!studentIds.length) {
    return [];
  }

  const [rows] = await db.query(`
    SELECT *
    FROM (
      SELECT
        sa.student_attendance_id AS attendance_id,
        sa.student_id,
        CONVERT(CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) USING utf8mb4) COLLATE utf8mb4_unicode_ci AS student_name,
        sa.attendance_date,
        CONVERT(sa.status USING utf8mb4) COLLATE utf8mb4_unicode_ci AS status,
        sa.check_in,
        CONVERT(sa.notes USING utf8mb4) COLLATE utf8mb4_unicode_ci AS notes,
        CONVERT(cs.subject USING utf8mb4) COLLATE utf8mb4_unicode_ci AS subject,
        CAST('PERIOD' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS attendance_type
      FROM ${studentAttendanceTable} sa
      LEFT JOIN ${studentsTable} s ON s.student_id = sa.student_id
      LEFT JOIN ${schedulesTable} cs ON cs.schedule_id = sa.schedule_id
      WHERE cs.client_id = ?
        AND sa.student_id IN (?)
      UNION ALL
      SELECT
        a.attendance_id,
        a.student_id,
        CONVERT(CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) USING utf8mb4) COLLATE utf8mb4_unicode_ci AS student_name,
        a.attendance_date,
        CONCAT(
          COALESCE(CONVERT(a.morning_status USING utf8mb4) COLLATE utf8mb4_unicode_ci, CAST('-' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci),
          CAST(' / ' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci,
          COALESCE(CONVERT(a.afternoon_status USING utf8mb4) COLLATE utf8mb4_unicode_ci, CAST('-' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci)
        ) AS status,
        a.check_in_time_morning AS check_in,
        CONVERT(a.remarks USING utf8mb4) COLLATE utf8mb4_unicode_ci AS notes,
        CAST(NULL AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS subject,
        CAST('DAY' AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci AS attendance_type
      FROM ${legacyAttendanceTable} a
      LEFT JOIN ${studentsTable} s ON s.student_id = a.student_id
      WHERE a.client_id = ?
        AND a.student_id IN (?)
    ) portal_attendance
    ORDER BY attendance_date DESC, attendance_id DESC
    LIMIT 60
  `, [clientId, studentIds, clientId, studentIds]);

  return rows;
}

async function fetchFees(clientId, studentIds) {
  if (!studentIds.length) {
    return [];
  }

  const [rows] = await db.query(`
    SELECT
      fr.fee_id,
      fr.fee_reg_no,
      fr.student_id,
      CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
      s.admission_number,
      fr.fee_year,
      fr.total,
      fr.deposit,
      fr.due_balance,
      fr.monthly_fee,
      fr.admission_fee,
      fr.registration_fee,
      fr.transport,
      fr.books,
      fr.uniform,
      fr.discount,
      c.name AS classroom_name
    FROM ${feeRecordsTable} fr
    INNER JOIN ${studentsTable} s ON s.student_id = fr.student_id
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = fr.classroom_id
    WHERE fr.client_id = ?
      AND fr.student_id IN (?)
    ORDER BY fr.fee_year DESC, fr.fee_id DESC
  `, [clientId, studentIds]);

  return rows;
}

async function fetchTransport(clientId, studentIds) {
  if (!studentIds.length) {
    return [];
  }

  const [rows] = await db.query(`
    SELECT
      s.student_id,
      CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
      s.pickupPoint,
      t.transport_id,
      t.vehicleNumber,
      t.route,
      t.capacity,
      t.departureTime,
      t.status,
      CONCAT_WS(' ', staff.firstName, staff.lastName) AS driver_name,
      staff.contactNumber AS driver_contact
    FROM ${studentsTable} s
    LEFT JOIN ${transportsTable} t ON t.transport_id = s.transport_id
    LEFT JOIN ${staffTable} staff ON staff.staff_id = t.driverName
    WHERE s.client_id = ?
      AND s.student_id IN (?)
      AND s.transport_id IS NOT NULL
    ORDER BY s.student_id ASC
  `, [clientId, studentIds]);

  return rows;
}

async function fetchHostel(clientId, studentIds) {
  if (!studentIds.length) {
    return { assignments: [], payments: [] };
  }

  await ensureHostelPaymentsTable();

  const [assignments] = await db.query(`
    SELECT
      sra.assignment_id,
      sra.student_id,
      CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
      s.admission_number,
      sra.room_id,
      hr.room_number,
      hr.gender_specific,
      hr.fee,
      COALESCE(SUM(hp.amount), 0) AS total_paid,
      GREATEST(CAST(COALESCE(hr.fee, 0) AS DECIMAL(10,2)) - COALESCE(SUM(hp.amount), 0), 0) AS due_balance,
      sra.start_date,
      sra.end_date,
      CASE
        WHEN sra.end_date IS NULL OR sra.end_date >= CURDATE() THEN 'Active'
        ELSE 'Checked out'
      END AS assignment_status
    FROM ${assignmentsTable} sra
    INNER JOIN ${studentsTable} s ON s.student_id = sra.student_id
    INNER JOIN ${roomsTable} hr ON hr.room_id = sra.room_id
    LEFT JOIN ${hostelPaymentsTable} hp ON hp.assignment_id = sra.assignment_id
    WHERE sra.client_id = ?
      AND sra.student_id IN (?)
    GROUP BY
      sra.assignment_id,
      sra.student_id,
      s.first_name,
      s.middle_name,
      s.last_name,
      s.admission_number,
      sra.room_id,
      hr.room_number,
      hr.gender_specific,
      hr.fee,
      sra.start_date,
      sra.end_date
    ORDER BY sra.start_date DESC, sra.assignment_id DESC
  `, [clientId, studentIds]);

  const [payments] = await db.query(`
    SELECT
      hp.payment_id,
      hp.assignment_id,
      hp.student_id,
      CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
      hp.room_id,
      hr.room_number,
      hp.receipt_no,
      hp.payment_date,
      hp.payment_type,
      hp.payment_mode,
      hp.amount,
      hp.notes,
      hp.created_at
    FROM ${hostelPaymentsTable} hp
    INNER JOIN ${studentsTable} s ON s.student_id = hp.student_id
    INNER JOIN ${roomsTable} hr ON hr.room_id = hp.room_id
    WHERE hp.client_id = ?
      AND hp.student_id IN (?)
    ORDER BY hp.payment_date DESC, hp.payment_id DESC
    LIMIT 50
  `, [clientId, studentIds]);

  return { assignments, payments };
}

async function fetchTeacher(clientId, teacherId) {
  if (!teacherId) {
    return null;
  }

  const [rows] = await db.query(`
    SELECT
      teacher_id,
      client_id,
      CONCAT_WS(' ', first_name, middle_name, last_name) AS teacher_name,
      first_name,
      middle_name,
      last_name,
      email,
      phone_number,
      alternate_phone,
      gender,
      department,
      designation,
      qualification,
      experience_years,
      subjects_taught,
      date_of_joining,
      employment_status,
      address_line1,
      city,
      state,
      country
    FROM ${teachersTable}
    WHERE client_id = ?
      AND teacher_id = ?
    LIMIT 1
  `, [clientId, teacherId]);

  return rows[0] || null;
}

async function fetchTeacherSchedules(clientId, teacherId) {
  if (!teacherId) {
    return [];
  }

  const [rows] = await db.query(`
    SELECT
      cs.schedule_id,
      cs.teacher_id,
      cs.classroom_id,
      c.name AS classroom_name,
      cs.session_id,
      ss.name AS session_name,
      cs.period_id,
      sp.label AS period_label,
      sp.start_time,
      sp.end_time,
      sp.duration_minutes,
      cs.subject,
      cs.grade,
      cs.section,
      cs.day_of_week,
      cs.schedule_date,
      cs.status,
      cs.notes
    FROM ${schedulesTable} cs
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = cs.classroom_id
    LEFT JOIN ${sessionsTable} ss ON ss.session_id = cs.session_id
    LEFT JOIN ${periodsTable} sp ON sp.period_id = cs.period_id
    WHERE cs.client_id = ?
      AND cs.teacher_id = ?
      AND (cs.status IS NULL OR cs.status = 'Active')
    ORDER BY
      COALESCE(cs.day_of_week, 8) ASC,
      cs.session_id ASC,
      sp.period_number ASC,
      c.name ASC
  `, [clientId, teacherId]);

  return rows;
}

async function fetchTeacherExams(clientId, teacherId) {
  if (!teacherId) {
    return [];
  }

  const [rows] = await db.query(`
    SELECT DISTINCT
      e.exam_id,
      e.subject_id,
      s.sub_name AS subject_name,
      s.classroom_id,
      c.name AS classroom_name,
      e.exam_date,
      e.total_marks,
      e.passing_marks,
      e.duration,
      CASE
        WHEN e.exam_date >= CURDATE() THEN 'Scheduled'
        ELSE 'Completed'
      END AS exam_status
    FROM ${examsTable} e
    INNER JOIN ${subjectsTable} s ON s.subject_id = e.subject_id
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = s.classroom_id
    INNER JOIN ${schedulesTable} cs ON cs.client_id = e.client_id
      AND cs.teacher_id = ?
      AND cs.classroom_id = s.classroom_id
      AND (cs.status IS NULL OR cs.status = 'Active')
      AND (
        LOWER(TRIM(cs.subject)) = LOWER(TRIM(s.sub_name))
        OR cs.subject IS NULL
        OR s.sub_name IS NULL
      )
    WHERE e.client_id = ?
    ORDER BY e.exam_date DESC, e.exam_id DESC
    LIMIT 50
  `, [teacherId, clientId]);

  return rows;
}

async function fetchTeacherAttendance(clientId, teacherId) {
  if (!teacherId) {
    return [];
  }

  const columns = await getTeacherAttendanceColumns();

  if (!columns.has('schedule_id')) {
    const [rows] = await db.query(`
      SELECT
        ta.attendance_id AS teacher_attendance_id,
        NULL AS schedule_id,
        ta.teacher_id,
        ta.attendance_date,
        ta.status,
        ta.check_in_time AS check_in,
        ta.remarks AS notes,
        NULL AS marked_by,
        NULL AS subject,
        NULL AS classroom_name,
        NULL AS period_label,
        NULL AS start_time,
        NULL AS end_time
      FROM ${teacherAttendanceTable} ta
      WHERE ta.client_id = ?
        AND ta.teacher_id = ?
      ORDER BY ta.attendance_date DESC, ta.attendance_id DESC
      LIMIT 60
    `, [clientId, teacherId]);

    return rows;
  }

  const [rows] = await db.query(`
    SELECT
      ta.teacher_attendance_id,
      ta.schedule_id,
      ta.teacher_id,
      ta.attendance_date,
      ta.status,
      ta.check_in,
      ta.notes,
      ta.marked_by,
      cs.subject,
      c.name AS classroom_name,
      sp.label AS period_label,
      sp.start_time,
      sp.end_time
    FROM ${teacherAttendanceTable} ta
    LEFT JOIN ${schedulesTable} cs ON cs.schedule_id = ta.schedule_id
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = cs.classroom_id
    LEFT JOIN ${periodsTable} sp ON sp.period_id = cs.period_id
    WHERE ta.teacher_id = ?
      AND (cs.client_id = ? OR cs.client_id IS NULL)
    ORDER BY ta.attendance_date DESC, ta.teacher_attendance_id DESC
    LIMIT 60
  `, [teacherId, clientId]);

  return rows;
}

async function fetchTeacherLeaves(clientId, teacherId) {
  if (!teacherId) {
    return [];
  }

  const [rows] = await db.query(`
    SELECT
      leave_id,
      teacher_id,
      leave_date,
      leave_type,
      reason,
      status
    FROM ${teacherLeavesTable}
    WHERE client_id = ?
      AND teacher_id = ?
    ORDER BY leave_date DESC, leave_id DESC
    LIMIT 30
  `, [clientId, teacherId]);

  return rows;
}

function summarizeAttendance(attendance) {
  return attendance.reduce((summary, record) => {
    const key = String(record.status || '').toLowerCase();
    if (key.includes('present')) {
      summary.present += 1;
    } else if (key.includes('absent')) {
      summary.absent += 1;
    } else if (key.includes('late')) {
      summary.late += 1;
    } else if (key.includes('leave')) {
      summary.leave += 1;
    }

    summary.total += 1;
    return summary;
  }, { total: 0, present: 0, absent: 0, late: 0, leave: 0 });
}

function summarizeMoney(records) {
  return records.reduce((summary, record) => {
    summary.total += Number(record.total || record.fee || 0);
    summary.paid += Number(record.deposit || record.total_paid || 0);
    summary.due += Number(record.due_balance || 0);
    return summary;
  }, { total: 0, paid: 0, due: 0 });
}

function summarizeTeacherLeaves(leaves) {
  return leaves.reduce((summary, record) => {
    const key = String(record.status || '').toLowerCase();
    if (key.includes('approved')) {
      summary.approved += 1;
    } else if (key.includes('reject')) {
      summary.rejected += 1;
    } else {
      summary.pending += 1;
    }

    summary.total += 1;
    return summary;
  }, { total: 0, pending: 0, approved: 0, rejected: 0 });
}

async function buildTeacherPortalPayload(req) {
  const scope = await getScopedTeacherId(req);

  if (!scope.clientId || !scope.teacherId) {
    return emptyTeacherPortalPayload(scope.clientId);
  }

  const [teacher, teacherSchedules, teacherExams, teacherAttendance, teacherLeaves] = await Promise.all([
    fetchTeacher(scope.clientId, scope.teacherId),
    fetchTeacherSchedules(scope.clientId, scope.teacherId),
    fetchTeacherExams(scope.clientId, scope.teacherId),
    fetchTeacherAttendance(scope.clientId, scope.teacherId),
    fetchTeacherLeaves(scope.clientId, scope.teacherId)
  ]);

  return {
    ...emptyTeacherPortalPayload(scope.clientId),
    teacher,
    teacherSchedules,
    teacherExams,
    teacherAttendance,
    teacherLeaves,
    teacherTotals: {
      schedules: teacherSchedules.length,
      classes: new Set(
        teacherSchedules
          .map((row) => normalizePositiveInteger(row.classroom_id))
          .filter(Boolean)
      ).size,
      upcomingExams: teacherExams.filter((exam) => String(exam.exam_status || '').toLowerCase() === 'scheduled').length,
      attendance: summarizeAttendance(teacherAttendance),
      leaves: summarizeTeacherLeaves(teacherLeaves)
    }
  };
}

async function buildPortalPayload(req, requestedStudentId = null) {
  const context = getDecodedContext(req);
  if (isTeacher(context.decoded)) {
    return requestedStudentId ? { forbidden: true } : buildTeacherPortalPayload(req);
  }

  const scope = await getScopedStudentIds(req);
  const filteredScope = filterStudentIds(scope.studentIds, requestedStudentId);

  if (!filteredScope.allowed) {
    return { forbidden: true };
  }

  const studentIds = filteredScope.studentIds;

  if (!scope.clientId || !studentIds.length) {
    return emptyStudentPortalPayload(scope.clientId);
  }

  const [students, results, upcomingExams, attendance, fees, transport, hostel] = await Promise.all([
    fetchStudents(scope.clientId, studentIds),
    fetchResults(scope.clientId, studentIds),
    fetchUpcomingExams(scope.clientId, studentIds),
    fetchAttendance(scope.clientId, studentIds),
    fetchFees(scope.clientId, studentIds),
    fetchTransport(scope.clientId, studentIds),
    fetchHostel(scope.clientId, studentIds)
  ]);

  return {
    portal_type: 'student',
    clientId: scope.clientId,
    students,
    results,
    upcomingExams,
    attendance,
    fees,
    transport,
    hostel,
    totals: {
      students: students.length,
      attendance: summarizeAttendance(attendance),
      fees: summarizeMoney(fees),
      hostel: summarizeMoney(hostel.assignments)
    }
  };
}

async function getPortalSummary(req, res) {
  try {
    const payload = await buildPortalPayload(req);
    return res.status(200).json({
      success: true,
      data: payload
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function getPortalStudent(req, res) {
  try {
    const payload = await buildPortalPayload(req, req.params.studentId);

    if (payload.forbidden) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this student'
      });
    }

    return res.status(200).json({
      success: true,
      data: payload
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

module.exports = {
  getPortalSummary,
  getPortalStudent
};
