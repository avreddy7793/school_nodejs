const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const sessionsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('school_sessions')}`;
const periodsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('session_periods')}`;
const schedulesTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('class_schedule')}`;
const teachersTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('teachers')}`;
const classroomsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('classrooms')}`;
const sectionsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('sections')}`;
const subjectsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('subjects')}`;
const teacherAttendanceTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('teacher_attendance')}`;
const studentAttendanceTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('student_attendance')}`;
const studentsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('students')}`;

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
    schedule_id: getValue(body, 'scheduleId'),
    teacher_id: getValue(body, 'teacherId'),
    attendance_date: normalizeString(getValue(body, 'attendanceDate')),
    status: normalizeString(getValue(body, 'status')),
    check_in: normalizeString(getValue(body, 'checkIn')),
    notes: normalizeString(getValue(body, 'notes')),
    marked_by: getValue(body, 'markedBy', null)
  };
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
  const { classroom_id, session_id, teacher_id, status, client_id } = req.query;
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

function getTeacherAttendance(req, res) {
  const { schedule_id, attendance_date, client_id } = req.query;
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

  if (client_id) {
    conditions.push('cs.client_id = ?');
    values.push(client_id);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT
      ta.teacher_attendance_id,
      ta.schedule_id,
      ta.teacher_id,
      CONCAT(t.first_name, ' ', t.last_name) AS teacher_name,
      ta.attendance_date,
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
    ORDER BY ta.attendance_date DESC, ta.created_at DESC
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

function saveTeacherAttendance(req, res) {
  const payload = buildAttendancePayload(req.body);

  if (!payload.schedule_id || !payload.teacher_id || !payload.attendance_date || !payload.status) {
    return res.status(400).json({
      success: false,
      message: 'Schedule, teacher, date, and status are required'
    });
  }

  const sql = `
    INSERT INTO ${teacherAttendanceTable} (schedule_id, teacher_id, attendance_date, status, check_in, notes, marked_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      check_in = VALUES(check_in),
      notes = VALUES(notes),
      marked_by = VALUES(marked_by),
      updated_at = CURRENT_TIMESTAMP
  `;

  pool.query(sql, [payload.schedule_id, payload.teacher_id, payload.attendance_date, payload.status, payload.check_in, payload.notes, payload.marked_by], (error) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    return res.status(200).json({
      success: true,
      message: 'Teacher attendance saved successfully'
    });
  });
}

function getStudentAttendance(req, res) {
  const { schedule_id, attendance_date, client_id } = req.query;
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

  if (client_id) {
    conditions.push('cs.client_id = ?');
    values.push(client_id);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT
      sa.student_attendance_id,
      sa.schedule_id,
      sa.student_id,
      CONCAT(s.first_name, ' ', s.last_name) AS student_name,
      sa.attendance_date,
      sa.status,
      sa.check_in,
      sa.notes,
      sa.marked_by,
      sa.created_at,
      sa.updated_at
    FROM ${studentAttendanceTable} sa
    LEFT JOIN ${studentsTable} s ON s.student_id = sa.student_id
    LEFT JOIN ${schedulesTable} cs ON cs.schedule_id = sa.schedule_id
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

function saveStudentAttendance(req, res) {
  const rows = Array.isArray(req.body) ? req.body : [req.body];

  if (!rows.length) {
    return res.status(400).json({
      success: false,
      message: 'At least one attendance record is required'
    });
  }

  const values = rows.map((row) => [
    row.scheduleId,
    row.studentId,
    row.attendanceDate,
    row.status,
    row.checkIn || null,
    row.notes || null,
    row.markedBy || null
  ]);

  const sql = `
    INSERT INTO ${studentAttendanceTable} (schedule_id, student_id, attendance_date, status, check_in, notes, marked_by)
    VALUES ?
    ON DUPLICATE KEY UPDATE
      status = VALUES(status),
      check_in = VALUES(check_in),
      notes = VALUES(notes),
      marked_by = VALUES(marked_by),
      updated_at = CURRENT_TIMESTAMP
  `;

  pool.query(sql, [values], (error) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    return res.status(200).json({
      success: true,
      message: 'Student attendance saved successfully'
    });
  });
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
  getStudentsForSchedule,
  getTeacherAttendance,
  saveTeacherAttendance,
  getStudentAttendance,
  saveStudentAttendance
};
