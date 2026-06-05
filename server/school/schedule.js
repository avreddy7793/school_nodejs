const { pool } = require('../config');
const whatsapp = require('./whatsapp');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || process.env.DB_DATABASE || 'school';
const sessionsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('school_sessions')}`;
const periodsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('session_periods')}`;
const schedulesTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('class_schedule')}`;
const teachersTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('teachers')}`;
const staffTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('staff')}`;
const classroomsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('classrooms')}`;
const sectionsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('sections')}`;
const subjectsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('subjects')}`;
const teacherAttendanceTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('teacher_attendance')}`;
const staffAttendanceTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('staff_attendance')}`;
const studentAttendanceTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('student_attendance')}`;
const legacyAttendanceTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('attendance')}`;
const studentsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('students')}`;
const attendanceSettingsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('attendance_settings')}`;
const STUDENT_ATTENDANCE_MODE_KEY = 'student_attendance_mode';
const STUDENT_ATTENDANCE_MODES = new Set(['SESSION_WISE', 'PERIOD_WISE']);
const STUDENT_ATTENDANCE_SESSIONS = new Set(['Session', 'Period', 'Morning', 'Afternoon']);
const TEACHER_ATTENDANCE_SESSIONS = new Set(['Morning', 'Afternoon']);
let studentAttendanceSchemaReady = null;
let teacherAttendanceSchemaReady = null;
let staffAttendanceSchemaReady = null;

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

function normalizeString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    return String(value);
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function normalizePositiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeDayOfWeek(value) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return null;
  }

  const numericDay = normalizePositiveInteger(normalized);
  if (numericDay && numericDay <= 7) {
    return numericDay;
  }

  const dayMap = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 7
  };

  return dayMap[normalized.toUpperCase()] || null;
}

function normalizeAttendanceMode(value) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return 'PERIOD_WISE';
  }

  const key = normalized.toUpperCase().replace(/[\s-]+/g, '_');
  if (key === 'MORNING_SESSION' || key === 'AFTERNOON_SESSION' || key === 'SESSION') {
    return 'SESSION_WISE';
  }

  return STUDENT_ATTENDANCE_MODES.has(key) ? key : 'PERIOD_WISE';
}

function normalizeAttendanceSession(value) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return 'Period';
  }

  const key = normalized.toUpperCase().replace(/[\s-]+/g, '_');
  const sessionMap = {
    SESSION: 'Session',
    SESSION_WISE: 'Session',
    MORNING: 'Morning',
    MORNING_SESSION: 'Morning',
    AFTERNOON: 'Afternoon',
    AFTERNOON_SESSION: 'Afternoon',
    PERIOD: 'Period',
    PERIOD_WISE: 'Period'
  };

  const mapped = sessionMap[key];
  return mapped && STUDENT_ATTENDANCE_SESSIONS.has(mapped) ? mapped : 'Period';
}

function normalizeTeacherAttendanceSession(value) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return 'Morning';
  }

  const key = normalized.toUpperCase().replace(/[\s-]+/g, '_');
  const sessionMap = {
    MORNING: 'Morning',
    MORNING_SESSION: 'Morning',
    AFTERNOON: 'Afternoon',
    AFTERNOON_SESSION: 'Afternoon'
  };

  const mapped = sessionMap[key];
  return mapped && TEACHER_ATTENDANCE_SESSIONS.has(mapped) ? mapped : 'Morning';
}

function normalizeLegacyStudentStatus(value) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return 'Leave';
  }

  const key = normalized.toUpperCase().replace(/[\s-]+/g, '_');
  const statusMap = {
    PRESENT: 'Present',
    ABSENT: 'Absent',
    LATE: 'Late',
    LEAVE: 'Leave',
    ON_LEAVE: 'Leave',
    EXCUSED: 'Leave'
  };

  return statusMap[key] || 'Leave';
}

function isLegacySessionAttendance(row) {
  return row.attendanceSession === 'Morning' || row.attendanceSession === 'Afternoon';
}

async function ensureStudentSessionAttendanceOpen(rows) {
  const sessionRows = rows.filter((row) => row.attendanceSession !== 'Period');
  if (!sessionRows.length) {
    return null;
  }

  const scheduleIds = [...new Set(sessionRows.map((row) => row.scheduleId))];
  const schedules = await queryAsync(`
    SELECT schedule_id, client_id, classroom_id, section_id
    FROM ${schedulesTable}
    WHERE schedule_id IN (?)
  `, [scheduleIds]);
  const scheduleMap = new Map(schedules.map((schedule) => [Number(schedule.schedule_id), schedule]));

  for (const row of sessionRows) {
    const schedule = scheduleMap.get(row.scheduleId);
    if (!schedule) {
      return 'Schedule not found for student attendance.';
    }

    const existingRows = await queryAsync(`
      SELECT sa.student_attendance_id
      FROM ${studentAttendanceTable} sa
      INNER JOIN ${schedulesTable} cs ON cs.schedule_id = sa.schedule_id
      WHERE sa.attendance_date = ?
        AND sa.attendance_session = ?
        AND cs.classroom_id = ?
        AND (cs.section_id <=> ?)
        AND (? IS NULL OR cs.client_id = ?)
      LIMIT 1
    `, [
      row.attendanceDate,
      row.attendanceSession,
      schedule.classroom_id,
      schedule.section_id,
      row.clientId || schedule.client_id || null,
      row.clientId || schedule.client_id || null
    ]);

    if (existingRows.length) {
      return `${row.attendanceSession} attendance is already completed for this class on ${row.attendanceDate}.`;
    }
  }

  return null;
}

function getValue(body, key, fallback = undefined) {
  if (body[key] !== undefined) {
    return body[key];
  }

  return fallback;
}

function buildSchedulePayload(body) {
  return {
    client_id: getValue(body, 'clientId', getValue(body, 'client_id')),
    classroom_id: getValue(body, 'classroomId', getValue(body, 'classroom_id')),
    section_id: normalizePositiveInteger(getValue(body, 'sectionId', getValue(body, 'section_id'))),
    subject_id: normalizePositiveInteger(getValue(body, 'subjectId', getValue(body, 'subject_id'))),
    session_id: getValue(body, 'sessionId', getValue(body, 'session_id')),
    period_id: getValue(body, 'periodId', getValue(body, 'period_id')),
    teacher_id: getValue(body, 'teacherId', getValue(body, 'teacher_id')),
    day_of_week: getValue(body, 'dayOfWeek', null),
    schedule_date: getValue(body, 'scheduleDate', null),
    status: normalizeString(getValue(body, 'status')) || 'Active',
    notes: normalizeString(getValue(body, 'notes'))
  };
}

function buildAttendancePayload(body) {
  return {
    schedule_id: normalizePositiveInteger(getValue(body, 'scheduleId', getValue(body, 'schedule_id'))),
    teacher_id: normalizePositiveInteger(getValue(body, 'teacherId', getValue(body, 'teacher_id'))),
    attendance_date: normalizeString(getValue(body, 'attendanceDate')),
    attendance_session: normalizeTeacherAttendanceSession(getValue(body, 'attendanceSession', getValue(body, 'attendance_session'))),
    status: normalizeString(getValue(body, 'status')),
    check_in: normalizeString(getValue(body, 'checkIn')),
    notes: normalizeString(getValue(body, 'notes')),
    marked_by: getValue(body, 'markedBy', null)
  };
}

function buildStaffAttendancePayload(body) {
  return {
    staff_id: normalizePositiveInteger(getValue(body, 'staffId', getValue(body, 'staff_id'))),
    attendance_date: normalizeString(getValue(body, 'attendanceDate')),
    attendance_session: normalizeTeacherAttendanceSession(getValue(body, 'attendanceSession', getValue(body, 'attendance_session'))),
    status: normalizeString(getValue(body, 'status')),
    check_in: normalizeString(getValue(body, 'checkIn')),
    notes: normalizeString(getValue(body, 'notes')),
    marked_by: getValue(body, 'markedBy', null)
  };
}

function ensureAttendanceSettingsTable(callback) {
  const sql = `
    CREATE TABLE IF NOT EXISTS ${attendanceSettingsTable} (
      setting_id INT NOT NULL AUTO_INCREMENT,
      client_id BIGINT NOT NULL,
      setting_key VARCHAR(80) NOT NULL,
      setting_value VARCHAR(80) NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (setting_id),
      UNIQUE KEY uq_attendance_settings_client_key (client_id, setting_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  pool.query(sql, callback);
}

function queryAsync(sql, values = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, values, (error, results) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(results);
    });
  });
}

function ensureStudentAttendanceSchema() {
  if (!studentAttendanceSchemaReady) {
    studentAttendanceSchemaReady = (async () => {
      const attendanceSessionColumn = await queryAsync(`SHOW COLUMNS FROM ${studentAttendanceTable} LIKE ?`, ['attendance_session']);
      if (!attendanceSessionColumn.length) {
        await queryAsync(`
          ALTER TABLE ${studentAttendanceTable}
          ADD COLUMN attendance_session VARCHAR(20) NOT NULL DEFAULT 'Period' AFTER attendance_date
        `);
      }

      const markedByTeacherColumn = await queryAsync(`SHOW COLUMNS FROM ${studentAttendanceTable} LIKE ?`, ['marked_by_teacher_id']);
      if (!markedByTeacherColumn.length) {
        await queryAsync(`
          ALTER TABLE ${studentAttendanceTable}
          ADD COLUMN marked_by_teacher_id INT DEFAULT NULL AFTER marked_by
        `);
      }

      const sessionUniqueIndex = await queryAsync(`SHOW INDEX FROM ${studentAttendanceTable} WHERE Key_name = ?`, ['uq_student_attendance_session']);
      if (!sessionUniqueIndex.length) {
        await queryAsync(`
          ALTER TABLE ${studentAttendanceTable}
          ADD UNIQUE KEY uq_student_attendance_session (schedule_id, student_id, attendance_date, attendance_session)
        `);
      }

      const oldUniqueIndex = await queryAsync(`SHOW INDEX FROM ${studentAttendanceTable} WHERE Key_name = ?`, ['uq_student_attendance']);
      if (oldUniqueIndex.length) {
        await queryAsync(`ALTER TABLE ${studentAttendanceTable} DROP INDEX uq_student_attendance`);
      }
    })().catch((error) => {
      studentAttendanceSchemaReady = null;
      throw error;
    });
  }

  return studentAttendanceSchemaReady;
}

function ensureTeacherAttendanceSchema() {
  if (!teacherAttendanceSchemaReady) {
    teacherAttendanceSchemaReady = (async () => {
      const columns = await queryAsync(`SHOW COLUMNS FROM ${teacherAttendanceTable}`);
      const columnNames = new Set(columns.map((column) => column.Field));
      const hadCheckInTime = columnNames.has('check_in_time');
      const hadRemarks = columnNames.has('remarks');

      if (!columnNames.has('client_id')) {
        await queryAsync(`ALTER TABLE ${teacherAttendanceTable} ADD COLUMN client_id BIGINT DEFAULT NULL AFTER attendance_id`);
      }

      if (!columnNames.has('schedule_id')) {
        await queryAsync(`ALTER TABLE ${teacherAttendanceTable} ADD COLUMN schedule_id INT DEFAULT NULL AFTER client_id`);
      }

      if (!columnNames.has('attendance_session')) {
        await queryAsync(`
          ALTER TABLE ${teacherAttendanceTable}
          ADD COLUMN attendance_session VARCHAR(20) NOT NULL DEFAULT 'Morning' AFTER attendance_date
        `);
      }

      if (!columnNames.has('check_in')) {
        await queryAsync(`ALTER TABLE ${teacherAttendanceTable} ADD COLUMN check_in TIME DEFAULT NULL AFTER status`);

        if (hadCheckInTime) {
          await queryAsync(`UPDATE ${teacherAttendanceTable} SET check_in = check_in_time WHERE check_in IS NULL`);
        }
      }

      if (!columnNames.has('notes')) {
        await queryAsync(`ALTER TABLE ${teacherAttendanceTable} ADD COLUMN notes TEXT DEFAULT NULL AFTER check_in`);

        if (hadRemarks) {
          await queryAsync(`UPDATE ${teacherAttendanceTable} SET notes = remarks WHERE notes IS NULL`);
        }
      }

      if (!columnNames.has('marked_by')) {
        await queryAsync(`ALTER TABLE ${teacherAttendanceTable} ADD COLUMN marked_by INT DEFAULT NULL AFTER notes`);
      }

      await queryAsync(`
        ALTER TABLE ${teacherAttendanceTable}
        MODIFY status ENUM('Present','Late','Absent','On Leave') NOT NULL
      `);

      const oldUniqueIndex = await queryAsync(`SHOW INDEX FROM ${teacherAttendanceTable} WHERE Key_name = ?`, ['uq_teacher_schedule_attendance']);
      if (oldUniqueIndex.length) {
        await queryAsync(`ALTER TABLE ${teacherAttendanceTable} DROP INDEX uq_teacher_schedule_attendance`);
      }
    })().catch((error) => {
      teacherAttendanceSchemaReady = null;
      throw error;
    });
  }

  return teacherAttendanceSchemaReady;
}

function ensureStaffAttendanceSchema() {
  if (!staffAttendanceSchemaReady) {
    staffAttendanceSchemaReady = (async () => {
      await queryAsync(`
        CREATE TABLE IF NOT EXISTS ${staffAttendanceTable} (
          attendance_id INT NOT NULL AUTO_INCREMENT,
          client_id BIGINT DEFAULT NULL,
          staff_id INT NOT NULL,
          attendance_date DATE NOT NULL,
          attendance_session ENUM('Morning','Afternoon') NOT NULL DEFAULT 'Morning',
          status ENUM('Present','Late','Absent','On Leave') NOT NULL DEFAULT 'Present',
          check_in TIME DEFAULT NULL,
          notes TEXT DEFAULT NULL,
          marked_by INT DEFAULT NULL,
          created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (attendance_id),
          KEY idx_staff_attendance_staff (staff_id),
          KEY idx_staff_attendance_client_date (client_id, attendance_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
      `);

      const columns = await queryAsync(`SHOW COLUMNS FROM ${staffAttendanceTable}`);
      const columnNames = new Set(columns.map((column) => column.Field));

      if (!columnNames.has('client_id')) {
        await queryAsync(`ALTER TABLE ${staffAttendanceTable} ADD COLUMN client_id BIGINT DEFAULT NULL AFTER attendance_id`);
      }

      if (!columnNames.has('staff_id')) {
        await queryAsync(`ALTER TABLE ${staffAttendanceTable} ADD COLUMN staff_id INT NOT NULL AFTER client_id`);
      }

      if (!columnNames.has('attendance_date')) {
        await queryAsync(`ALTER TABLE ${staffAttendanceTable} ADD COLUMN attendance_date DATE NOT NULL AFTER staff_id`);
      }

      if (!columnNames.has('attendance_session')) {
        await queryAsync(`
          ALTER TABLE ${staffAttendanceTable}
          ADD COLUMN attendance_session ENUM('Morning','Afternoon') NOT NULL DEFAULT 'Morning' AFTER attendance_date
        `);
      }

      if (!columnNames.has('status')) {
        await queryAsync(`
          ALTER TABLE ${staffAttendanceTable}
          ADD COLUMN status ENUM('Present','Late','Absent','On Leave') NOT NULL DEFAULT 'Present' AFTER attendance_session
        `);
      } else {
        await queryAsync(`
          ALTER TABLE ${staffAttendanceTable}
          MODIFY status ENUM('Present','Late','Absent','On Leave') NOT NULL DEFAULT 'Present'
        `);
      }

      if (!columnNames.has('check_in')) {
        await queryAsync(`ALTER TABLE ${staffAttendanceTable} ADD COLUMN check_in TIME DEFAULT NULL AFTER status`);
      }

      if (!columnNames.has('notes')) {
        await queryAsync(`ALTER TABLE ${staffAttendanceTable} ADD COLUMN notes TEXT DEFAULT NULL AFTER check_in`);
      }

      if (!columnNames.has('marked_by')) {
        await queryAsync(`ALTER TABLE ${staffAttendanceTable} ADD COLUMN marked_by INT DEFAULT NULL AFTER notes`);
      }

      if (!columnNames.has('created_at')) {
        await queryAsync(`ALTER TABLE ${staffAttendanceTable} ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER marked_by`);
      }

      if (!columnNames.has('updated_at')) {
        await queryAsync(`
          ALTER TABLE ${staffAttendanceTable}
          ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at
        `);
      }

      const sessionUniqueIndex = await queryAsync(`SHOW INDEX FROM ${staffAttendanceTable} WHERE Key_name = ?`, ['uq_staff_attendance_session']);
      if (!sessionUniqueIndex.length) {
        await queryAsync(`
          ALTER TABLE ${staffAttendanceTable}
          ADD UNIQUE KEY uq_staff_attendance_session (client_id, staff_id, attendance_date, attendance_session)
        `);
      }
    })().catch((error) => {
      staffAttendanceSchemaReady = null;
      throw error;
    });
  }

  return staffAttendanceSchemaReady;
}

async function saveLegacySessionAttendance(rows) {
  const sessionRows = rows.filter(isLegacySessionAttendance);
  if (!sessionRows.length) {
    return;
  }

  const scheduleIds = [...new Set(sessionRows.map((row) => row.scheduleId).filter(Boolean))];
  const scheduleMap = new Map();

  if (scheduleIds.length) {
    const schedules = await queryAsync(`
      SELECT schedule_id, client_id, teacher_id
      FROM ${schedulesTable}
      WHERE schedule_id IN (?)
    `, [scheduleIds]);

    schedules.forEach((schedule) => {
      scheduleMap.set(Number(schedule.schedule_id), schedule);
    });
  }

  const valueForRow = (row) => {
    const schedule = scheduleMap.get(Number(row.scheduleId)) || {};
    return [
      schedule.client_id || null,
      row.studentId,
      row.markedByTeacherId || schedule.teacher_id || null,
      row.attendanceDate,
      normalizeLegacyStudentStatus(row.status),
      row.notes,
      row.checkIn
    ];
  };

  const morningRows = sessionRows.filter((row) => row.attendanceSession === 'Morning').map(valueForRow);
  const afternoonRows = sessionRows.filter((row) => row.attendanceSession === 'Afternoon').map(valueForRow);

  if (morningRows.length) {
    await queryAsync(`
      INSERT INTO ${legacyAttendanceTable}
        (client_id, student_id, teacher_id, attendance_date, morning_status, remarks, check_in_time_morning)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        client_id = COALESCE(VALUES(client_id), client_id),
        teacher_id = COALESCE(VALUES(teacher_id), teacher_id),
        morning_status = VALUES(morning_status),
        remarks = COALESCE(VALUES(remarks), remarks),
        check_in_time_morning = COALESCE(VALUES(check_in_time_morning), check_in_time_morning)
    `, [morningRows]);
  }

  if (afternoonRows.length) {
    await queryAsync(`
      INSERT INTO ${legacyAttendanceTable}
        (client_id, student_id, teacher_id, attendance_date, afternoon_status, remarks, check_in_time_afternoon)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        client_id = COALESCE(VALUES(client_id), client_id),
        teacher_id = COALESCE(VALUES(teacher_id), teacher_id),
        afternoon_status = VALUES(afternoon_status),
        remarks = COALESCE(VALUES(remarks), remarks),
        check_in_time_afternoon = COALESCE(VALUES(check_in_time_afternoon), check_in_time_afternoon)
    `, [afternoonRows]);
  }
}

function getSessions(req, res) {
  const sql = `SELECT session_id, name, sort_order, is_active FROM ${sessionsTable} WHERE is_active = 1 ORDER BY sort_order ASC, name ASC`;

  pool.query(sql, (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    return res.status(200).json({
      success: true,
      data: results
    });
  });
}

function createSession(req, res) {
  const name = normalizeString(getValue(req.body, 'name'));

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Session name is required'
    });
  }

  const sql = `INSERT INTO ${sessionsTable} (name, sort_order, is_active) VALUES (?, ?, ?)`;
  const sortOrder = Number(getValue(req.body, 'sortOrder', 1));

  pool.query(sql, [name, sortOrder, getValue(req.body, 'isActive', 1)], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    return res.status(201).json({
      success: true,
      message: 'Session created successfully',
      session_id: result.insertId
    });
  });
}

function getPeriods(req, res) {
  const { session_id } = req.query;
  const conditions = [];
  const values = [];

  if (session_id) {
    conditions.push('session_id = ?');
    values.push(session_id);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT period_id, session_id, period_number, label, start_time, end_time, duration_minutes, is_active FROM ${periodsTable} ${whereClause} ORDER BY session_id ASC, period_number ASC`;

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

function createPeriod(req, res) {
  const sessionId = Number(getValue(req.body, 'sessionId'));
  const periodNumber = Number(getValue(req.body, 'periodNumber'));
  const label = normalizeString(getValue(req.body, 'label'));
  const startTime = normalizeString(getValue(req.body, 'startTime'));
  const endTime = normalizeString(getValue(req.body, 'endTime'));
  const durationMinutes = Number(getValue(req.body, 'durationMinutes'));

  if (!sessionId || !periodNumber || !label || !startTime || !endTime || !Number.isFinite(durationMinutes)) {
    return res.status(400).json({
      success: false,
      message: 'Session, period number, label, start time, end time, and duration are required'
    });
  }

  const sql = `INSERT INTO ${periodsTable} (session_id, period_number, label, start_time, end_time, duration_minutes, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`;

  pool.query(sql, [sessionId, periodNumber, label, startTime, endTime, durationMinutes, getValue(req.body, 'isActive', 1)], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    return res.status(201).json({
      success: true,
      message: 'Period created successfully',
      period_id: result.insertId
    });
  });
}

function getSchedules(req, res) {
  const { classroom_id, section_id, session_id, teacher_id, status, client_id, day_of_week } = req.query;
  const conditions = [];
  const values = [];

  if (client_id) {
    conditions.push('cs.client_id = ?');
    values.push(client_id);
  }

  if (classroom_id) {
    conditions.push('cs.classroom_id = ?');
    values.push(classroom_id);
  }

  if (section_id) {
    conditions.push('cs.section_id = ?');
    values.push(section_id);
  }

  if (session_id) {
    conditions.push('cs.session_id = ?');
    values.push(session_id);
  }

  if (teacher_id) {
    conditions.push('cs.teacher_id = ?');
    values.push(teacher_id);
  }

  if (status) {
    conditions.push('cs.status = ?');
    values.push(status);
  }

  const normalizedDay = normalizeDayOfWeek(day_of_week);
  if (normalizedDay) {
    conditions.push('cs.day_of_week = ?');
    values.push(normalizedDay);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT
      cs.schedule_id,
      cs.client_id,
      cs.classroom_id,
      c.name AS classroom_name,
      cs.session_id,
      ss.name AS session_name,
      cs.period_id,
      sp.label AS period_label,
      sp.start_time,
      sp.end_time,
      sp.duration_minutes,
      cs.teacher_id,
      CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
      cs.subject_id,
      subj.sub_name AS subject,
      c.name AS grade,
      cs.section_id,
      sec.section_name AS section,
      cs.day_of_week,
      cs.schedule_date,
      cs.status,
      cs.notes,
      cs.created_at,
      cs.updated_at
    FROM ${schedulesTable} cs
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = cs.classroom_id
    LEFT JOIN ${sessionsTable} ss ON ss.session_id = cs.session_id
    LEFT JOIN ${periodsTable} sp ON sp.period_id = cs.period_id
    LEFT JOIN ${teachersTable} t ON t.teacher_id = cs.teacher_id
    LEFT JOIN ${subjectsTable} subj ON subj.subject_id = cs.subject_id
    LEFT JOIN ${sectionsTable} sec ON sec.section_id = cs.section_id
    ${whereClause}
    ORDER BY cs.session_id ASC, sp.period_number ASC, c.name ASC
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

function getScheduleById(req, res) {
  const clientId = req.query.client_id;
  const sql = `
    SELECT
      cs.schedule_id,
      cs.client_id,
      cs.classroom_id,
      c.name AS classroom_name,
      cs.session_id,
      ss.name AS session_name,
      cs.period_id,
      sp.label AS period_label,
      sp.start_time,
      sp.end_time,
      sp.duration_minutes,
      cs.teacher_id,
      CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
      cs.subject_id,
      subj.sub_name AS subject,
      c.name AS grade,
      cs.section_id,
      sec.section_name AS section,
      cs.day_of_week,
      cs.schedule_date,
      cs.status,
      cs.notes,
      cs.created_at,
      cs.updated_at
    FROM ${schedulesTable} cs
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = cs.classroom_id
    LEFT JOIN ${sessionsTable} ss ON ss.session_id = cs.session_id
    LEFT JOIN ${periodsTable} sp ON sp.period_id = cs.period_id
    LEFT JOIN ${teachersTable} t ON t.teacher_id = cs.teacher_id
    LEFT JOIN ${subjectsTable} subj ON subj.subject_id = cs.subject_id
    LEFT JOIN ${sectionsTable} sec ON sec.section_id = cs.section_id
    WHERE cs.schedule_id = ?
      AND (? IS NULL OR cs.client_id = ?)
  `;

  pool.query(sql, [req.params.scheduleId, clientId || null, clientId || null], (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: results[0]
    });
  });
}

function createSchedule(req, res) {
  const payload = buildSchedulePayload(req.body);

  if (!payload.classroom_id || !payload.session_id || !payload.period_id || !payload.teacher_id) {
    return res.status(400).json({
      success: false,
      message: 'Classroom, session, period, and teacher are required'
    });
  }

  const duplicateSql = `
    SELECT schedule_id
    FROM ${schedulesTable}
    WHERE classroom_id = ?
      AND session_id = ?
      AND period_id = ?
      AND (day_of_week IS NULL OR day_of_week = ?)
      AND (schedule_date IS NULL OR schedule_date = ?)
    LIMIT 1
  `;

  pool.query(duplicateSql, [payload.classroom_id, payload.session_id, payload.period_id, payload.day_of_week, payload.schedule_date], (dupError, duplicateResults) => {
    if (dupError) {
      return sendDatabaseError(res, dupError);
    }

    if (duplicateResults.length) {
      return res.status(409).json({
        success: false,
        message: 'A schedule already exists for this classroom, session, and period'
      });
    }

    pool.query(`INSERT INTO ${schedulesTable} SET ?`, payload, (error, result) => {
      if (error) {
        return sendDatabaseError(res, error);
      }

      return res.status(201).json({
        success: true,
        message: 'Schedule created successfully',
        schedule_id: result.insertId
      });
    });
  });
}

function updateSchedule(req, res) {
  const payload = buildSchedulePayload(req.body);

  if (!Object.keys(payload).length) {
    return res.status(400).json({
      success: false,
      message: 'No updatable fields were provided'
    });
  }

  pool.query(`UPDATE ${schedulesTable} SET ? WHERE schedule_id = ?`, [payload, req.params.scheduleId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Schedule updated successfully'
    });
  });
}

function getStudentAttendanceSettings(req, res) {
  const clientId = normalizePositiveInteger(req.query.client_id || req.decoded?.client_id);

  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'Client id is required'
    });
  }

  ensureAttendanceSettingsTable((tableError) => {
    if (tableError) {
      return sendDatabaseError(res, tableError);
    }

    const sql = `
      SELECT setting_value
      FROM ${attendanceSettingsTable}
      WHERE client_id = ? AND setting_key = ?
      LIMIT 1
    `;

    pool.query(sql, [clientId, STUDENT_ATTENDANCE_MODE_KEY], (error, results) => {
      if (error) {
        return sendDatabaseError(res, error);
      }

      const mode = normalizeAttendanceMode(results[0]?.setting_value);
      return res.status(200).json({
        success: true,
        data: {
          student_attendance_mode: mode
        }
      });
    });
  });
}

function updateStudentAttendanceSettings(req, res) {
  const clientId = normalizePositiveInteger(req.body.clientId || req.body.client_id || req.query.client_id || req.decoded?.client_id);
  const mode = normalizeAttendanceMode(req.body.studentAttendanceMode || req.body.student_attendance_mode);

  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'Client id is required'
    });
  }

  ensureAttendanceSettingsTable((tableError) => {
    if (tableError) {
      return sendDatabaseError(res, tableError);
    }

    const sql = `
      INSERT INTO ${attendanceSettingsTable} (client_id, setting_key, setting_value)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        setting_value = VALUES(setting_value),
        updated_at = CURRENT_TIMESTAMP
    `;

    pool.query(sql, [clientId, STUDENT_ATTENDANCE_MODE_KEY, mode], (error) => {
      if (error) {
        return sendDatabaseError(res, error);
      }

      return res.status(200).json({
        success: true,
        message: 'Student attendance settings saved successfully',
        data: {
          student_attendance_mode: mode
        }
      });
    });
  });
}

function assignTeacherToSchedule(req, res) {
  const scheduleId = normalizePositiveInteger(req.params.scheduleId);
  const teacherId = normalizePositiveInteger(getValue(req.body, 'teacherId', getValue(req.body, 'teacher_id')));
  const clientId = normalizePositiveInteger(getValue(req.body, 'clientId', getValue(req.body, 'client_id', req.query.client_id || req.decoded?.client_id)));

  if (!scheduleId || !teacherId) {
    return res.status(400).json({
      success: false,
      message: 'Schedule and teacher are required'
    });
  }

  const teacherSql = `
    SELECT teacher_id
    FROM ${teachersTable}
    WHERE teacher_id = ?
      AND (? IS NULL OR client_id = ?)
    LIMIT 1
  `;

  pool.query(teacherSql, [teacherId, clientId || null, clientId || null], (teacherError, teachers) => {
    if (teacherError) {
      return sendDatabaseError(res, teacherError);
    }

    if (!teachers.length) {
      return res.status(400).json({
        success: false,
        message: 'Choose a valid teacher for this client'
      });
    }

    const scheduleSql = `
      SELECT schedule_id
      FROM ${schedulesTable}
      WHERE schedule_id = ?
        AND (? IS NULL OR client_id = ?)
      LIMIT 1
    `;

    pool.query(scheduleSql, [scheduleId, clientId || null, clientId || null], (scheduleError, schedules) => {
      if (scheduleError) {
        return sendDatabaseError(res, scheduleError);
      }

      if (!schedules.length) {
        return res.status(404).json({
          success: false,
          message: 'Schedule assignment not found'
        });
      }

      const columns = ['teacher_id = ?'];
      const values = [teacherId];
      const optionalFields = {
        status: 'status',
        notes: 'notes'
      };

      Object.entries(optionalFields).forEach(([bodyKey, column]) => {
        if (req.body[bodyKey] !== undefined) {
          columns.push(`${column} = ?`);
          values.push(normalizeString(req.body[bodyKey]));
        }
      });

      const optionalIdFields = {
        subjectId: 'subject_id',
        subject_id: 'subject_id',
        sectionId: 'section_id',
        section_id: 'section_id'
      };

      Object.entries(optionalIdFields).forEach(([bodyKey, column]) => {
        if (req.body[bodyKey] !== undefined) {
          columns.push(`${column} = ?`);
          values.push(normalizePositiveInteger(req.body[bodyKey]));
        }
      });

      values.push(scheduleId, clientId || null, clientId || null);

      const updateSql = `
        UPDATE ${schedulesTable}
        SET ${columns.join(', ')}
        WHERE schedule_id = ?
          AND (? IS NULL OR client_id = ?)
      `;

      pool.query(updateSql, values, (updateError) => {
        if (updateError) {
          return sendDatabaseError(res, updateError);
        }

        return res.status(200).json({
          success: true,
          message: 'Teacher assigned to class successfully'
        });
      });
    });
  });
}

function deleteSchedule(req, res) {
  pool.query(`DELETE FROM ${schedulesTable} WHERE schedule_id = ?`, [req.params.scheduleId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  });
}

function getStudentsForSchedule(req, res) {
  const scheduleId = req.params.scheduleId;
  const clientId = req.query.client_id;

  const scheduleSql = `
    SELECT
      cs.classroom_id,
      sec.section_name AS section
    FROM ${schedulesTable} cs
    LEFT JOIN ${sectionsTable} sec ON sec.section_id = cs.section_id
    WHERE cs.schedule_id = ?
      AND (? IS NULL OR cs.client_id = ?)
  `;

  pool.query(scheduleSql, [scheduleId, clientId || null, clientId || null], (scheduleError, scheduleResults) => {
    if (scheduleError) {
      return sendDatabaseError(res, scheduleError);
    }

    if (!scheduleResults.length) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found'
      });
    }

    const { classroom_id, section } = scheduleResults[0];
    const filters = [];
    const values = [];

    if (clientId) {
      filters.push('client_id = ?');
      values.push(clientId);
    }

    if (classroom_id) {
      filters.push('class_name = ?');
      values.push(classroom_id);
    }

    if (section) {
      filters.push('section = ?');
      values.push(section);
    }

    filters.push('enrollment_status <> ?');
    values.push('Left');

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const studentSql = `
      SELECT student_id, first_name, middle_name, last_name, current_grade, grade_level, section, enrollment_status
      FROM ${studentsTable}
      ${whereClause}
      ORDER BY first_name ASC, last_name ASC
    `;

    pool.query(studentSql, values, (studentError, studentResults) => {
      if (studentError) {
        return sendDatabaseError(res, studentError);
      }

      return res.status(200).json({
        success: true,
        data: studentResults
      });
    });
  });
}

async function getTeacherAttendance(req, res) {
  try {
    await ensureTeacherAttendanceSchema();
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const { schedule_id, attendance_date, attendance_session, client_id, teacher_id } = req.query;
  const conditions = [];
  const values = [];

  if (schedule_id) {
    conditions.push('ta.schedule_id = ?');
    values.push(schedule_id);
  }

  if (attendance_date) {
    conditions.push('ta.attendance_date = ?');
    values.push(attendance_date);
  }

  if (attendance_session) {
    conditions.push('ta.attendance_session = ?');
    values.push(normalizeTeacherAttendanceSession(attendance_session));
  }

  if (teacher_id) {
    conditions.push('ta.teacher_id = ?');
    values.push(teacher_id);
  }

  if (client_id) {
    conditions.push('(ta.client_id = ? OR cs.client_id = ?)');
    values.push(client_id, client_id);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT
      ta.attendance_id AS teacher_attendance_id,
      ta.schedule_id,
      ta.teacher_id,
      CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
      ta.attendance_date,
      ta.attendance_session,
      ta.status,
      ta.check_in,
      ta.notes,
      ta.marked_by,
      ta.created_at,
      ta.updated_at
    FROM ${teacherAttendanceTable} ta
    LEFT JOIN ${teachersTable} t ON t.teacher_id = ta.teacher_id
    LEFT JOIN ${schedulesTable} cs ON cs.schedule_id = ta.schedule_id
    ${whereClause}
    ORDER BY ta.attendance_date DESC, FIELD(ta.attendance_session, 'Morning', 'Afternoon') ASC, ta.created_at DESC
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

async function saveTeacherAttendance(req, res) {
  try {
    await ensureTeacherAttendanceSchema();
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const payload = buildAttendancePayload(req.body);
  const requestedClientId = normalizePositiveInteger(req.body.clientId || req.body.client_id || req.query.client_id || req.decoded?.client_id);

  if (!payload.teacher_id || !payload.attendance_date || !payload.status) {
    return res.status(400).json({
      success: false,
      message: 'Teacher, date, session, and status are required'
    });
  }

  const scheduleSql = payload.schedule_id ? `
    SELECT client_id
    FROM ${schedulesTable}
    WHERE schedule_id = ?
    LIMIT 1
  ` : null;

  const saveRecord = (scheduleClientId = null) => {
    const clientId = requestedClientId || normalizePositiveInteger(scheduleClientId);
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client id is required'
      });
    }

    const findExistingSql = `
      SELECT attendance_id
      FROM ${teacherAttendanceTable}
      WHERE client_id = ?
        AND teacher_id = ?
        AND attendance_date = ?
        AND attendance_session = ?
      LIMIT 1
    `;
    const findValues = [clientId, payload.teacher_id, payload.attendance_date, payload.attendance_session];

    pool.query(findExistingSql, findValues, (findError, existingRows) => {
      if (findError) {
        return sendDatabaseError(res, findError);
      }

      if (existingRows.length) {
        const updateSql = `
          UPDATE ${teacherAttendanceTable}
          SET schedule_id = ?,
              status = ?,
              check_in = COALESCE(?, check_in, CURTIME()),
              notes = ?,
              marked_by = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE attendance_id = ?
        `;

        return pool.query(
          updateSql,
          [payload.schedule_id || null, payload.status, payload.check_in, payload.notes, payload.marked_by, existingRows[0].attendance_id],
          (updateError) => {
            if (updateError) {
              return sendDatabaseError(res, updateError);
            }

            return res.status(200).json({
              success: true,
              message: 'Teacher attendance saved successfully'
            });
          }
        );
      }

      const insertSql = `
        INSERT INTO ${teacherAttendanceTable} (client_id, schedule_id, teacher_id, attendance_date, attendance_session, status, check_in, notes, marked_by)
        VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURTIME()), ?, ?)
      `;

      return pool.query(
        insertSql,
        [clientId, payload.schedule_id || null, payload.teacher_id, payload.attendance_date, payload.attendance_session, payload.status, payload.check_in, payload.notes, payload.marked_by],
        (insertError) => {
          if (insertError) {
            return sendDatabaseError(res, insertError);
          }

          return res.status(200).json({
            success: true,
            message: 'Teacher attendance saved successfully'
          });
        }
      );
    });
  };

  if (!scheduleSql) {
    return saveRecord();
  }

  pool.query(scheduleSql, [payload.schedule_id], (scheduleError, schedules) => {
    if (scheduleError) {
      return sendDatabaseError(res, scheduleError);
    }

    return saveRecord(schedules[0]?.client_id);
  });
}

async function getStaffAttendance(req, res) {
  try {
    await ensureStaffAttendanceSchema();
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const { attendance_date, attendance_session, client_id, staff_id } = req.query;
  const conditions = [];
  const values = [];

  if (attendance_date) {
    conditions.push('sa.attendance_date = ?');
    values.push(attendance_date);
  }

  if (attendance_session) {
    conditions.push('sa.attendance_session = ?');
    values.push(normalizeTeacherAttendanceSession(attendance_session));
  }

  if (staff_id) {
    conditions.push('sa.staff_id = ?');
    values.push(staff_id);
  }

  if (client_id) {
    conditions.push('(sa.client_id = ? OR st.client_id = ?)');
    values.push(client_id, client_id);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT
      sa.attendance_id AS staff_attendance_id,
      sa.client_id,
      sa.staff_id,
      TRIM(CONCAT_WS(' ', st.firstName, st.lastName)) AS staff_name,
      st.employee_id,
      st.role AS staff_role,
      sa.attendance_date,
      sa.attendance_session,
      sa.status,
      sa.check_in,
      sa.notes,
      sa.marked_by,
      sa.created_at,
      sa.updated_at
    FROM ${staffAttendanceTable} sa
    LEFT JOIN ${staffTable} st ON st.staff_id = sa.staff_id
    ${whereClause}
    ORDER BY sa.attendance_date DESC, FIELD(sa.attendance_session, 'Morning', 'Afternoon') ASC, sa.created_at DESC
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

async function saveStaffAttendance(req, res) {
  try {
    await ensureStaffAttendanceSchema();
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const payload = buildStaffAttendancePayload(req.body);
  const requestedClientId = normalizePositiveInteger(req.body.clientId || req.body.client_id || req.query.client_id || req.decoded?.client_id);

  if (!payload.staff_id || !payload.attendance_date || !payload.status) {
    return res.status(400).json({
      success: false,
      message: 'Staff member, date, session, and status are required'
    });
  }

  const staffSql = `
    SELECT client_id
    FROM ${staffTable}
    WHERE staff_id = ?
    LIMIT 1
  `;

  pool.query(staffSql, [payload.staff_id], (staffError, staffRows) => {
    if (staffError) {
      return sendDatabaseError(res, staffError);
    }

    if (!staffRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    const clientId = requestedClientId || normalizePositiveInteger(staffRows[0].client_id);
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client id is required'
      });
    }

    const findExistingSql = `
      SELECT attendance_id
      FROM ${staffAttendanceTable}
      WHERE client_id = ?
        AND staff_id = ?
        AND attendance_date = ?
        AND attendance_session = ?
      LIMIT 1
    `;
    const findValues = [clientId, payload.staff_id, payload.attendance_date, payload.attendance_session];

    pool.query(findExistingSql, findValues, (findError, existingRows) => {
      if (findError) {
        return sendDatabaseError(res, findError);
      }

      if (existingRows.length) {
        const updateSql = `
          UPDATE ${staffAttendanceTable}
          SET status = ?,
              check_in = COALESCE(?, check_in, CURTIME()),
              notes = ?,
              marked_by = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE attendance_id = ?
        `;

        return pool.query(
          updateSql,
          [payload.status, payload.check_in, payload.notes, payload.marked_by, existingRows[0].attendance_id],
          (updateError) => {
            if (updateError) {
              return sendDatabaseError(res, updateError);
            }

            return res.status(200).json({
              success: true,
              message: 'Staff attendance saved successfully'
            });
          }
        );
      }

      const insertSql = `
        INSERT INTO ${staffAttendanceTable} (client_id, staff_id, attendance_date, attendance_session, status, check_in, notes, marked_by)
        VALUES (?, ?, ?, ?, ?, COALESCE(?, CURTIME()), ?, ?)
      `;

      return pool.query(
        insertSql,
        [clientId, payload.staff_id, payload.attendance_date, payload.attendance_session, payload.status, payload.check_in, payload.notes, payload.marked_by],
        (insertError) => {
          if (insertError) {
            return sendDatabaseError(res, insertError);
          }

          return res.status(200).json({
            success: true,
            message: 'Staff attendance saved successfully'
          });
        }
      );
    });
  });
}

async function getStudentAttendance(req, res) {
  try {
    await ensureStudentAttendanceSchema();
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const { schedule_id, attendance_date, attendance_session, client_id, classroom_id, section_id, teacher_id } = req.query;
  const conditions = [];
  const values = [];

  if (schedule_id) {
    conditions.push('sa.schedule_id = ?');
    values.push(schedule_id);
  }

  if (attendance_date) {
    conditions.push('sa.attendance_date = ?');
    values.push(attendance_date);
  }

  const normalizedSession = normalizeString(attendance_session);
  if (normalizedSession) {
    const session = normalizeAttendanceSession(normalizedSession);
    if (session === 'Session') {
      conditions.push('sa.attendance_session IN (?, ?, ?)');
      values.push('Session', 'Morning', 'Afternoon');
    } else {
      conditions.push('sa.attendance_session = ?');
      values.push(session);
    }
  }

  if (client_id) {
    conditions.push('cs.client_id = ?');
    values.push(client_id);
  }

  if (classroom_id) {
    conditions.push('cs.classroom_id = ?');
    values.push(classroom_id);
  }

  if (section_id) {
    conditions.push('cs.section_id = ?');
    values.push(section_id);
  }

  if (teacher_id) {
    conditions.push('cs.teacher_id = ?');
    values.push(teacher_id);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT
      sa.student_attendance_id,
      sa.schedule_id,
      sa.student_id,
      CONCAT(s.first_name, ' ', s.last_name) AS student_name,
      sa.attendance_date,
      sa.attendance_session,
      sa.status,
      sa.check_in,
      sa.notes,
      sa.marked_by,
      sa.marked_by_teacher_id,
      NULLIF(TRIM(CONCAT(COALESCE(markedTeacher.first_name, ''), ' ', COALESCE(markedTeacher.last_name, ''))), '') AS marked_by_teacher_name,
      cs.classroom_id,
      cs.section_id,
      cs.teacher_id,
      NULLIF(TRIM(CONCAT(COALESCE(scheduleTeacher.first_name, ''), ' ', COALESCE(scheduleTeacher.last_name, ''))), '') AS schedule_teacher_name,
      sa.created_at,
      sa.updated_at
    FROM ${studentAttendanceTable} sa
    LEFT JOIN ${studentsTable} s ON s.student_id = sa.student_id
    LEFT JOIN ${schedulesTable} cs ON cs.schedule_id = sa.schedule_id
    LEFT JOIN ${teachersTable} markedTeacher ON markedTeacher.teacher_id = sa.marked_by_teacher_id
    LEFT JOIN ${teachersTable} scheduleTeacher ON scheduleTeacher.teacher_id = cs.teacher_id
    ${whereClause}
    ORDER BY sa.attendance_date DESC, sa.created_at DESC
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

async function saveStudentAttendance(req, res) {
  const rows = Array.isArray(req.body) ? req.body : [req.body];
  const requestClientId = normalizePositiveInteger(
    req.query.client_id ||
    (Array.isArray(req.body) ? null : req.body.clientId || req.body.client_id) ||
    req.decoded?.client_id
  );

  if (!rows.length) {
    return res.status(400).json({
      success: false,
      message: 'At least one attendance record is required'
    });
  }

  const normalizedRows = rows.map((row) => ({
    scheduleId: normalizePositiveInteger(row.scheduleId || row.schedule_id),
    studentId: normalizePositiveInteger(row.studentId || row.student_id),
    clientId: normalizePositiveInteger(row.clientId || row.client_id) || requestClientId,
    attendanceDate: normalizeString(row.attendanceDate || row.attendance_date),
    attendanceSession: normalizeAttendanceSession(row.attendanceSession || row.attendance_session),
    status: normalizeString(row.status),
    checkIn: normalizeString(row.checkIn || row.check_in),
    notes: normalizeString(row.notes),
    markedBy: row.markedBy || row.marked_by || null,
    markedByTeacherId: normalizePositiveInteger(row.markedByTeacherId || row.marked_by_teacher_id)
  }));

  const hasInvalidRow = normalizedRows.some((row) => !row.scheduleId || !row.studentId || !row.attendanceDate || !row.status);
  if (hasInvalidRow) {
    return res.status(400).json({
      success: false,
      message: 'Schedule, student, date, and status are required for every attendance record'
    });
  }

  try {
    await ensureStudentAttendanceSchema();
    const sessionAttendanceError = await ensureStudentSessionAttendanceOpen(normalizedRows);
    if (sessionAttendanceError) {
      return res.status(409).json({
        success: false,
        message: sessionAttendanceError
      });
    }

    await saveLegacySessionAttendance(normalizedRows);
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const values = normalizedRows.map((row) => [
    row.scheduleId,
    row.studentId,
    row.clientId,
    row.attendanceDate,
    row.attendanceSession,
    row.status,
    row.checkIn,
    row.notes,
    row.markedBy,
    row.markedByTeacherId
  ]);

  const sql = `
    INSERT INTO ${studentAttendanceTable} (schedule_id, student_id, client_id, attendance_date, attendance_session, status, check_in, notes, marked_by, marked_by_teacher_id)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      client_id = COALESCE(VALUES(client_id), client_id),
      status = VALUES(status),
      check_in = VALUES(check_in),
      notes = VALUES(notes),
      marked_by = VALUES(marked_by),
      marked_by_teacher_id = COALESCE(VALUES(marked_by_teacher_id), marked_by_teacher_id),
      updated_at = CURRENT_TIMESTAMP
  `;

  try {
    await queryAsync(sql, [values]);
    let whatsappSummary = null;
    try {
      whatsappSummary = await whatsapp.notifyStudentAttendance(normalizedRows);
    } catch (notificationError) {
      whatsappSummary = {
        success: false,
        sent: 0,
        skipped: 0,
        failed: normalizedRows.length,
        message: notificationError.message
      };
    }

    return res.status(200).json({
      success: true,
      message: whatsappSummary?.sent
        ? `Student attendance saved successfully. ${whatsappSummary.sent} WhatsApp message${whatsappSummary.sent === 1 ? '' : 's'} sent.`
        : 'Student attendance saved successfully',
      whatsapp: whatsappSummary
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

module.exports = {
  getSessions,
  createSession,
  getPeriods,
  createPeriod,
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  assignTeacherToSchedule,
  deleteSchedule,
  getStudentAttendanceSettings,
  updateStudentAttendanceSettings,
  getStudentsForSchedule,
  getTeacherAttendance,
  saveTeacherAttendance,
  getStaffAttendance,
  saveStaffAttendance,
  getStudentAttendance,
  saveStudentAttendance
};
