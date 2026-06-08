const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || process.env.DB_DATABASE || 'school';
const examGroupsTable = table('exam_groups');
const examGroupClassesTable = table('exam_group_classes');
const examGroupSettingsTable = table('exam_group_settings');
const examHallTicketsTable = table('exam_hall_tickets');
const examsTable = table('exams');
const examResultsTable = table('exam_results');
const classroomsTable = table('classrooms');
const sectionsTable = table('sections');
const subjectsTable = table('subjects');
const studentsTable = table('students');
const teacherSubjectAssignmentsTable = table('teacher_subject_assignments');
const clientMasterTable = table('client_master');

const EXAM_TYPES = ['Month Test', 'Unit Test 1', 'Unit Test 2', 'Half Yearly', 'Unit Test 3', 'Unit Test 4', 'Pre Final', 'Final Exam', 'Online', 'Other'];
const ADMIN_ROLE_NAMES = new Set(['SUPER ADMIN', 'SCHOOL ADMIN', 'ADMIN', 'ADMINISTRATOR', 'MASTER', 'OWNER', 'PRINCIPAL', 'MANAGER', 'BRANCH MANAGER']);
const ADMIN_ROLE_IDS = new Set(['1', '2', '3', '4', '5']);

function escapeIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``;
}

function table(name) {
  return `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier(name)}`;
}

function sendDatabaseError(res, error) {
  return res.status(500).json({
    success: false,
    message: 'Database error',
    error: error.message
  });
}

function normalizeRole(value) {
  return String(value || '').trim().toUpperCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function decodedRoles(decoded = {}) {
  return [
    decoded.role,
    decoded.role_name,
    decoded.roleName,
    decoded.login_type,
    decoded.loginType,
    decoded.category,
    decoded.entity_type,
    decoded.entityType
  ].map(normalizeRole).filter(Boolean);
}

function isAdminDecoded(decoded = {}) {
  return decodedRoles(decoded).some((role) => ADMIN_ROLE_NAMES.has(role)) || ADMIN_ROLE_IDS.has(String(decoded.role || ''));
}

function isTeacherDecoded(decoded = {}) {
  return decodedRoles(decoded).includes('TEACHER');
}

function requireExamAdmin(req, res, next) {
  if (!isAdminDecoded(req.decoded || {})) {
    return res.status(403).json({
      success: false,
      message: 'Only admin users can manage exam workflow.'
    });
  }

  return next();
}

function getValue(source, camelKey, snakeKey = camelKey, fallback = undefined) {
  if (!source) {
    return fallback;
  }

  if (source[camelKey] !== undefined) {
    return source[camelKey];
  }

  if (source[snakeKey] !== undefined) {
    return source[snakeKey];
  }

  return fallback;
}

function normalizePositiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeOptionalPositiveInteger(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return normalizePositiveInteger(value);
}

function normalizeNonNegativeInteger(value, fallback = null) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function normalizeText(value, fallback = null) {
  if (value === undefined || value === null) {
    return fallback;
  }

  const trimmed = String(value).trim();
  return trimmed || fallback;
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : String(value).slice(0, 10);
}

function normalizeTime(value, fallback) {
  const text = normalizeText(value);
  if (!text) {
    return fallback;
  }

  return /^\d{2}:\d{2}(:\d{2})?$/.test(text) ? text : fallback;
}

function normalizeBoolean(value) {
  return value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true';
}

function clientIdFrom(req) {
  return normalizePositiveInteger(
    getValue(req.body, 'clientId', 'client_id') ||
    getValue(req.query, 'clientId', 'client_id') ||
    req.decoded?.client_id ||
    req.decoded?.clientId ||
    req.decoded?.clientid
  );
}

function loginIdFrom(req) {
  return normalizeOptionalPositiveInteger(
    req.decoded?.login_id ||
    req.decoded?.loginId ||
    getValue(req.body, 'generatedBy', 'generated_by') ||
    getValue(req.body, 'createdBy', 'created_by') ||
    getValue(req.body, 'enteredBy', 'entered_by')
  );
}

function teacherIdFrom(req) {
  const decoded = req.decoded || {};
  return normalizeOptionalPositiveInteger(
    decoded.teacher_id ||
    decoded.teacherId ||
    (normalizeRole(decoded.entity_type || decoded.entityType) === 'TEACHER' ? decoded.entity_id || decoded.entityId : null) ||
    getValue(req.body, 'teacherId', 'teacher_id') ||
    getValue(req.query, 'teacherId', 'teacher_id')
  );
}

function normalizeExamType(value, fallback = 'Other') {
  const normalized = normalizeText(value);
  return normalized && EXAM_TYPES.includes(normalized) ? normalized : fallback;
}

function examTypeFromName(name) {
  return normalizeExamType(name, 'Other');
}

function examTypeFromRequest(req) {
  const value = getValue(req.body, 'examType', 'exam_type') || getValue(req.query, 'examType', 'exam_type');
  return value ? normalizeExamType(value, null) : null;
}

function mapExamGroupRow(row) {
  return {
    ...row,
    exam_type: normalizeExamType(row.exam_type, examTypeFromName(row.exam_name))
  };
}

function toDateKey(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

function addDays(date, count) {
  const next = new Date(date);
  next.setDate(next.getDate() + count);
  return next;
}

function gradeFromPercentage(percentage) {
  if (!Number.isFinite(percentage)) {
    return null;
  }

  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 35) return 'D';
  return 'F';
}

function passFailStatus(marks, passingMarks, absent) {
  if (absent) {
    return 'ABSENT';
  }

  return Number(marks || 0) >= Number(passingMarks || 0) ? 'PASS' : 'FAIL';
}

function subjectTotalMarks(subject, settings = {}) {
  const subjectMarks = normalizeNonNegativeInteger(subject?.marks);
  return subjectMarks || Number(settings.total_marks || 100);
}

function passingMarksFromTotal(totalMarks) {
  return Math.max(1, Math.ceil(Number(totalMarks || 100) * 0.35));
}

function settingsFromBody(body) {
  const examsPerDay = normalizeNonNegativeInteger(getValue(body, 'examsPerDay', 'exams_per_day'), 1);
  const totalMarks = normalizeNonNegativeInteger(getValue(body, 'totalMarks', 'total_marks'), 100);
  const passingMarks = normalizeNonNegativeInteger(getValue(body, 'passingMarks', 'passing_marks'), 35);

  return {
    exams_per_day: examsPerDay === 2 ? 2 : 1,
    default_duration: normalizeNonNegativeInteger(getValue(body, 'examDuration', 'default_duration'), 180) || 180,
    morning_start_time: normalizeTime(getValue(body, 'morningStartTime', 'morning_start_time'), '09:30:00'),
    afternoon_start_time: normalizeTime(getValue(body, 'afternoonStartTime', 'afternoon_start_time'), '13:30:00'),
    include_sunday: normalizeBoolean(getValue(body, 'includeSunday', 'include_sunday')) ? 1 : 0,
    total_marks: totalMarks || 100,
    passing_marks: passingMarks || 35
  };
}

async function loadExamGroup(connection, examGroupId, clientId) {
  const [groups] = await connection.query(
    `SELECT * FROM ${examGroupsTable} WHERE exam_group_id = ? AND client_id = ? LIMIT 1`,
    [examGroupId, clientId]
  );

  return groups[0] || null;
}

async function loadExamGroupSettings(connection, examGroupId) {
  const [settings] = await connection.query(
    `SELECT * FROM ${examGroupSettingsTable} WHERE exam_group_id = ? ORDER BY setting_id DESC LIMIT 1`,
    [examGroupId]
  );

  return settings[0] || {
    exam_group_id: examGroupId,
    exams_per_day: 1,
    default_duration: 180,
    morning_start_time: '09:30:00',
    afternoon_start_time: '13:30:00',
    include_sunday: 0,
    total_marks: 100,
    passing_marks: 35
  };
}

async function loadExamGroupAssignments(connection, examGroupId, clientId) {
  const [rows] = await connection.query(`
    SELECT
      egc.id,
      egc.client_id,
      egc.exam_group_id,
      egc.classroom_id,
      c.name AS classroom_name,
      egc.section_id,
      sec.section_name
    FROM ${examGroupClassesTable} egc
    INNER JOIN ${classroomsTable} c ON c.classroom_id = egc.classroom_id
    LEFT JOIN ${sectionsTable} sec ON sec.section_id = egc.section_id
    WHERE egc.exam_group_id = ? AND egc.client_id = ?
    ORDER BY c.name ASC, sec.section_name ASC
  `, [examGroupId, clientId]);

  return rows;
}

async function validateExamGroup(req, res) {
  const clientId = clientIdFrom(req);
  const examGroupId = normalizePositiveInteger(req.params.examGroupId || req.params.groupId);

  if (!clientId) {
    res.status(400).json({ success: false, message: 'client_id is required' });
    return null;
  }

  if (!examGroupId) {
    res.status(400).json({ success: false, message: 'Valid exam group id is required' });
    return null;
  }

  const connection = pool.promise();
  const group = await loadExamGroup(connection, examGroupId, clientId);
  if (!group) {
    res.status(404).json({ success: false, message: 'Exam group not found' });
    return null;
  }

  return { clientId, examGroupId, group };
}

async function getDashboard(req, res) {
  const clientId = clientIdFrom(req);
  if (!clientId) {
    return res.status(400).json({ success: false, message: 'client_id is required' });
  }

  try {
    const database = pool.promise();
    const [[groupStats]] = await database.query(`
      SELECT
        COUNT(*) AS total_exams,
        COALESCE(SUM(status = 'ACTIVE'), 0) AS active_exams,
        COALESCE(SUM(status IN ('COMPLETED', 'PUBLISHED')), 0) AS completed_exams,
        COALESCE(SUM(status = 'PUBLISHED'), 0) AS published_exams
      FROM ${examGroupsTable}
      WHERE client_id = ?
    `, [clientId]);
    const [[ticketStats]] = await database.query(`
      SELECT COUNT(*) AS hall_tickets_generated
      FROM ${examHallTicketsTable}
      WHERE client_id = ? AND status = 'GENERATED'
    `, [clientId]);
    const [[markStats]] = await database.query(`
      SELECT
        COUNT(DISTINCT CONCAT(e.exam_id, ':', st.student_id)) AS expected_marks,
        COUNT(DISTINCT CONCAT(er.exam_id, ':', er.student_id)) AS entered_marks
      FROM ${examsTable} e
      INNER JOIN ${studentsTable} st
        ON st.client_id = e.client_id
        AND st.class_name = e.classroom_id
        AND st.enrollment_status = 'Active'
      LEFT JOIN ${sectionsTable} sec ON sec.section_id = e.section_id
      LEFT JOIN ${examResultsTable} er ON er.exam_id = e.exam_id AND er.student_id = st.student_id
      WHERE e.client_id = ?
        AND e.exam_group_id IS NOT NULL
        AND (
          e.section_id IS NULL
          OR UPPER(TRIM(st.section)) = UPPER(TRIM(sec.section_name))
        )
    `, [clientId]);
    const [recentExamGroups] = await database.query(`
      SELECT
        eg.*,
        MIN(e.exam_type) AS exam_type,
        COUNT(DISTINCT e.exam_id) AS timetable_count,
        COUNT(DISTINCT ht.hall_ticket_id) AS hall_ticket_count,
        COUNT(DISTINCT er.exam_resu_id) AS result_count
      FROM ${examGroupsTable} eg
      LEFT JOIN ${examsTable} e ON e.exam_group_id = eg.exam_group_id AND e.client_id = eg.client_id
      LEFT JOIN ${examHallTicketsTable} ht ON ht.exam_group_id = eg.exam_group_id AND ht.client_id = eg.client_id AND ht.status = 'GENERATED'
      LEFT JOIN ${examResultsTable} er ON er.exam_id = e.exam_id AND er.client_id = eg.client_id
      WHERE eg.client_id = ?
      GROUP BY eg.exam_group_id
      ORDER BY eg.created_at DESC
      LIMIT 5
    `, [clientId]);

    const expectedMarks = Number(markStats.expected_marks || 0);
    const enteredMarks = Number(markStats.entered_marks || 0);
    const totalGroups = Number(groupStats.total_exams || 0);
    const publishedGroups = Number(groupStats.published_exams || 0);

    return res.status(200).json({
      success: true,
      data: {
        total_exams: totalGroups,
        active_exams: Number(groupStats.active_exams || 0),
        completed_exams: Number(groupStats.completed_exams || 0),
        hall_tickets_generated: Number(ticketStats.hall_tickets_generated || 0),
        marks_entry_progress: expectedMarks ? Math.round((enteredMarks / expectedMarks) * 100) : 0,
        results_published: totalGroups ? Math.round((publishedGroups / totalGroups) * 100) : 0,
        recent_exam_groups: recentExamGroups.map(mapExamGroupRow)
      }
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function loadReadyReportProgress(connection, clientId, examGroupIds = []) {
  const groupIds = [...new Set((examGroupIds || []).map(Number).filter(Boolean))];
  const values = [clientId];
  let groupFilter = '';
  if (groupIds.length) {
    groupFilter = 'AND e.exam_group_id IN (?)';
    values.push(groupIds);
  }

  const [rows] = await connection.query(`
    SELECT
      e.exam_group_id,
      e.classroom_id,
      c.name AS classroom_name,
      e.section_id,
      sec.section_name,
      COUNT(DISTINCT CONCAT(e.exam_id, ':', st.student_id)) AS expected_result_count,
      COUNT(DISTINCT CONCAT(er.exam_id, ':', er.student_id)) AS entered_result_count
    FROM ${examsTable} e
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = e.classroom_id
    LEFT JOIN ${sectionsTable} sec ON sec.section_id = e.section_id
    INNER JOIN ${studentsTable} st
      ON st.client_id = e.client_id
      AND st.class_name = e.classroom_id
      AND st.enrollment_status = 'Active'
      AND (
        e.section_id IS NULL
        OR UPPER(TRIM(st.section)) = UPPER(TRIM(sec.section_name))
      )
    LEFT JOIN ${examResultsTable} er
      ON er.client_id = e.client_id
      AND er.exam_id = e.exam_id
      AND er.student_id = st.student_id
    WHERE e.client_id = ?
      AND e.exam_group_id IS NOT NULL
      ${groupFilter}
    GROUP BY e.exam_group_id, e.classroom_id, c.name, e.section_id, sec.section_name
  `, values);

  return rows;
}

function buildReadyReportMaps(classProgressRows) {
  const readyClassroomMap = new Map();
  const readyClassReportMap = new Map();

  classProgressRows.forEach((row) => {
    const groupId = Number(row.exam_group_id);
    const classroomId = Number(row.classroom_id);
    const expected = Number(row.expected_result_count || 0);
    const entered = Number(row.entered_result_count || 0);
    if (expected > 0 && entered >= expected) {
      const classroomList = readyClassroomMap.get(groupId) || [];
      if (!classroomList.includes(classroomId)) {
        classroomList.push(classroomId);
      }
      readyClassroomMap.set(groupId, classroomList);

      const reportList = readyClassReportMap.get(groupId) || [];
      reportList.push({
        classroom_id: classroomId,
        classroom_name: row.classroom_name || null,
        section_id: row.section_id || null,
        section_name: row.section_name || null,
        expected_result_count: expected,
        entered_result_count: entered
      });
      readyClassReportMap.set(groupId, reportList);
    }
  });

  return { readyClassroomMap, readyClassReportMap };
}

async function getExamGroups(req, res) {
  const clientId = clientIdFrom(req);
  if (!clientId) {
    return res.status(400).json({ success: false, message: 'client_id is required' });
  }

  try {
    const database = pool.promise();
    const [
      [groups],
      [assignmentCounts],
      [timetableCounts],
      [ticketCounts],
      [resultCounts],
      [expectedCounts],
      classProgressRows
    ] = await Promise.all([
      database.query(`
        SELECT *
        FROM ${examGroupsTable}
        WHERE client_id = ?
        ORDER BY created_at DESC
      `, [clientId]),
      database.query(`
        SELECT exam_group_id, COUNT(*) AS assignment_count
        FROM ${examGroupClassesTable}
        WHERE client_id = ?
        GROUP BY exam_group_id
      `, [clientId]),
      database.query(`
        SELECT exam_group_id, MIN(exam_type) AS exam_type, COUNT(*) AS timetable_count
        FROM ${examsTable}
        WHERE client_id = ? AND exam_group_id IS NOT NULL
        GROUP BY exam_group_id
      `, [clientId]),
      database.query(`
        SELECT exam_group_id, COUNT(*) AS hall_ticket_count
        FROM ${examHallTicketsTable}
        WHERE client_id = ? AND status = 'GENERATED'
        GROUP BY exam_group_id
      `, [clientId]),
      database.query(`
        SELECT
          e.exam_group_id,
          COUNT(DISTINCT er.exam_resu_id) AS result_count,
          COUNT(DISTINCT CONCAT(er.exam_id, ':', er.student_id)) AS entered_result_count
        FROM ${examResultsTable} er
        INNER JOIN ${examsTable} e ON e.exam_id = er.exam_id AND e.client_id = er.client_id
        WHERE er.client_id = ? AND e.exam_group_id IS NOT NULL
        GROUP BY e.exam_group_id
      `, [clientId]),
      database.query(`
        SELECT
          e.exam_group_id,
          COUNT(*) AS expected_result_count
        FROM ${examsTable} e
        INNER JOIN ${studentsTable} st
          ON st.client_id = e.client_id
          AND st.class_name = e.classroom_id
          AND st.enrollment_status = 'Active'
        LEFT JOIN ${sectionsTable} sec ON sec.section_id = e.section_id
        WHERE e.client_id = ?
          AND e.exam_group_id IS NOT NULL
          AND (
            e.section_id IS NULL
            OR UPPER(TRIM(st.section)) = UPPER(TRIM(sec.section_name))
          )
        GROUP BY e.exam_group_id
      `, [clientId]),
      loadReadyReportProgress(database, clientId)
    ]);

    const countMaps = [assignmentCounts, timetableCounts, ticketCounts, resultCounts, expectedCounts].map((rows) => new Map(
      rows.map((row) => [Number(row.exam_group_id), row])
    ));
    const { readyClassroomMap, readyClassReportMap } = buildReadyReportMaps(classProgressRows);
    const mergedGroups = groups.map((group) => {
      const groupId = Number(group.exam_group_id);
      const readyClassroomIds = readyClassroomMap.get(groupId) || [];
      const readyClassReports = readyClassReportMap.get(groupId) || [];
      return {
        ...group,
        exam_type: countMaps[1].get(groupId)?.exam_type || group.exam_type,
        assignment_count: Number(countMaps[0].get(groupId)?.assignment_count || 0),
        timetable_count: Number(countMaps[1].get(groupId)?.timetable_count || 0),
        hall_ticket_count: Number(countMaps[2].get(groupId)?.hall_ticket_count || 0),
        result_count: Number(countMaps[3].get(groupId)?.result_count || 0),
        entered_result_count: Number(countMaps[3].get(groupId)?.entered_result_count || 0),
        expected_result_count: Number(countMaps[4].get(groupId)?.expected_result_count || 0),
        class_report_ready_count: readyClassReports.length,
        ready_classroom_ids: readyClassroomIds,
        ready_class_reports: readyClassReports
      };
    });

    return res.status(200).json({ success: true, data: mergedGroups.map(mapExamGroupRow) });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function getExamGroupById(req, res) {
  try {
    const context = await validateExamGroup(req, res);
    if (!context) {
      return null;
    }

    const database = pool.promise();
    const [assignments, settings, timetable, tickets] = await Promise.all([
      loadExamGroupAssignments(database, context.examGroupId, context.clientId),
      loadExamGroupSettings(database, context.examGroupId),
      loadTimetable(database, context.examGroupId, context.clientId),
      loadHallTickets(database, context.examGroupId, context.clientId, {})
    ]);

    const examGroup = {
      ...context.group,
      exam_type: normalizeExamType(timetable[0]?.exam_type, examTypeFromName(context.group.exam_name))
    };

    return res.status(200).json({
      success: true,
      data: {
        exam_group: examGroup,
        assignments,
        settings,
        timetable,
        hall_tickets: tickets
      }
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function createExamGroup(req, res) {
  const clientId = clientIdFrom(req);
  const examName = normalizeText(getValue(req.body, 'examName', 'exam_name'));
  const academicYear = normalizeText(getValue(req.body, 'academicYear', 'academic_year'));
  const startDate = normalizeDate(getValue(req.body, 'startDate', 'start_date')) || toDateKey(new Date());
  let endDate = normalizeDate(getValue(req.body, 'endDate', 'end_date')) || startDate;
  const status = ['DRAFT', 'ACTIVE', 'COMPLETED', 'PUBLISHED'].includes(String(getValue(req.body, 'status')).toUpperCase())
    ? String(getValue(req.body, 'status')).toUpperCase()
    : 'DRAFT';

  if (!clientId || !examName) {
    return res.status(400).json({
      success: false,
      message: 'client_id and exam name are required'
    });
  }

  if (new Date(endDate) < new Date(startDate)) {
    endDate = startDate;
  }

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();
    const [result] = await connection.query(`INSERT INTO ${examGroupsTable} SET ?`, {
      client_id: clientId,
      exam_name: examName,
      academic_year: academicYear,
      start_date: startDate,
      end_date: endDate,
      status,
      created_by: loginIdFrom(req)
    });
    const examGroupId = result.insertId;
    await connection.query(`INSERT INTO ${examGroupSettingsTable} SET ?`, {
      exam_group_id: examGroupId,
      ...settingsFromBody(req.body)
    });
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      data: { exam_group_id: examGroupId }
    });
  } catch (error) {
    await connection.rollback();
    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

async function updateExamGroup(req, res) {
  try {
    const context = await validateExamGroup(req, res);
    if (!context) {
      return null;
    }

    const payload = {};
    const examType = req.body.examType !== undefined || req.body.exam_type !== undefined
      ? normalizeExamType(getValue(req.body, 'examType', 'exam_type'), null)
      : null;
    if (req.body.examName !== undefined || req.body.exam_name !== undefined) payload.exam_name = normalizeText(getValue(req.body, 'examName', 'exam_name'));
    if (req.body.academicYear !== undefined || req.body.academic_year !== undefined) payload.academic_year = normalizeText(getValue(req.body, 'academicYear', 'academic_year'));
    if (req.body.startDate !== undefined || req.body.start_date !== undefined) {
      const startDate = normalizeDate(getValue(req.body, 'startDate', 'start_date'));
      if (startDate) payload.start_date = startDate;
    }
    if (req.body.endDate !== undefined || req.body.end_date !== undefined) {
      const endDate = normalizeDate(getValue(req.body, 'endDate', 'end_date'));
      if (endDate) payload.end_date = endDate;
    }
    if (req.body.status !== undefined) {
      const status = String(req.body.status || '').toUpperCase();
      if (['DRAFT', 'ACTIVE', 'COMPLETED', 'PUBLISHED'].includes(status)) payload.status = status;
    }

    if (payload.start_date && payload.end_date && new Date(payload.end_date) < new Date(payload.start_date)) {
      payload.end_date = payload.start_date;
    }

    if (!Object.keys(payload).length && !examType) {
      return res.status(400).json({ success: false, message: 'No exam fields supplied' });
    }

    const database = pool.promise();
    if (Object.keys(payload).length) {
      await database.query(
        `UPDATE ${examGroupsTable} SET ? WHERE exam_group_id = ? AND client_id = ?`,
        [payload, context.examGroupId, context.clientId]
      );
    }
    if (examType) {
      await database.query(
        `UPDATE ${examsTable} SET exam_type = ? WHERE exam_group_id = ? AND client_id = ?`,
        [examType, context.examGroupId, context.clientId]
      );
    }

    return res.status(200).json({ success: true, message: 'Exam updated successfully' });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function deleteExamGroup(req, res) {
  try {
    const context = await validateExamGroup(req, res);
    if (!context) {
      return null;
    }

    const connection = await pool.promise().getConnection();
    try {
      await connection.beginTransaction();
      const [exams] = await connection.query(
        `SELECT exam_id FROM ${examsTable} WHERE exam_group_id = ? AND client_id = ?`,
        [context.examGroupId, context.clientId]
      );
      const examIds = exams.map((exam) => exam.exam_id);

      if (examIds.length) {
        await connection.query(`DELETE FROM ${examResultsTable} WHERE client_id = ? AND exam_id IN (?)`, [context.clientId, examIds]);
      }

      await connection.query(`DELETE FROM ${examHallTicketsTable} WHERE exam_group_id = ? AND client_id = ?`, [context.examGroupId, context.clientId]);
      await connection.query(`DELETE FROM ${examsTable} WHERE exam_group_id = ? AND client_id = ?`, [context.examGroupId, context.clientId]);
      await connection.query(`DELETE FROM ${examGroupClassesTable} WHERE exam_group_id = ? AND client_id = ?`, [context.examGroupId, context.clientId]);
      await connection.query(`DELETE FROM ${examGroupSettingsTable} WHERE exam_group_id = ?`, [context.examGroupId]);
      await connection.query(`DELETE FROM ${examGroupsTable} WHERE exam_group_id = ? AND client_id = ?`, [context.examGroupId, context.clientId]);
      await connection.commit();

      return res.status(200).json({ success: true, message: 'Exam deleted successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

function normalizeAssignmentItems(body) {
  const rawAssignments = Array.isArray(body.assignments) ? body.assignments : [];
  const items = [];

  rawAssignments.forEach((assignment) => {
    const classroomId = normalizePositiveInteger(getValue(assignment, 'classroomId', 'classroom_id'));
    if (!classroomId) {
      return;
    }

    const rawSections = assignment.sectionIds || assignment.section_ids || assignment.sections || [];
    const sectionIds = Array.isArray(rawSections) ? rawSections : [rawSections];
    const validSectionIds = sectionIds
      .map(normalizeOptionalPositiveInteger)
      .filter(Boolean);

    if (!validSectionIds.length) {
      items.push({ classroom_id: classroomId, section_id: null });
      return;
    }

    validSectionIds.forEach((sectionId) => items.push({ classroom_id: classroomId, section_id: sectionId }));
  });

  return items.filter((item, index, all) =>
    all.findIndex((other) => other.classroom_id === item.classroom_id && other.section_id === item.section_id) === index
  );
}

async function saveExamGroupClasses(req, res) {
  try {
    const context = await validateExamGroup(req, res);
    if (!context) {
      return null;
    }

    const assignments = normalizeAssignmentItems(req.body);
    if (!assignments.length) {
      return res.status(400).json({ success: false, message: 'Select at least one class or section' });
    }

    const connection = await pool.promise().getConnection();
    try {
      await connection.beginTransaction();

      for (const assignment of assignments) {
        const [classes] = await connection.query(
          `SELECT classroom_id FROM ${classroomsTable} WHERE classroom_id = ? AND client_id = ?`,
          [assignment.classroom_id, context.clientId]
        );
        if (!classes.length) {
          await connection.rollback();
          return res.status(400).json({ success: false, message: 'Choose valid classes for this client' });
        }

        if (assignment.section_id) {
          const [sections] = await connection.query(
            `SELECT section_id FROM ${sectionsTable} WHERE section_id = ? AND classroom_id = ? AND client_id = ?`,
            [assignment.section_id, assignment.classroom_id, context.clientId]
          );
          if (!sections.length) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Choose valid sections for the selected classes' });
          }
        }
      }

      await connection.query(`DELETE FROM ${examGroupClassesTable} WHERE exam_group_id = ? AND client_id = ?`, [context.examGroupId, context.clientId]);
      await connection.query(
        `INSERT INTO ${examGroupClassesTable} (client_id, exam_group_id, classroom_id, section_id) VALUES ?`,
        [assignments.map((assignment) => [context.clientId, context.examGroupId, assignment.classroom_id, assignment.section_id])]
      );
      await connection.commit();

      const savedAssignments = await loadExamGroupAssignments(pool.promise(), context.examGroupId, context.clientId);
      return res.status(200).json({
        success: true,
        message: 'Class assignments saved successfully',
        data: savedAssignments
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function saveExamGroupSettings(req, res) {
  try {
    const context = await validateExamGroup(req, res);
    if (!context) {
      return null;
    }

    const payload = settingsFromBody(req.body);
    if (payload.passing_marks > payload.total_marks) {
      return res.status(400).json({ success: false, message: 'Passing marks cannot be greater than total marks' });
    }

    const database = pool.promise();
    const [existing] = await database.query(`SELECT setting_id FROM ${examGroupSettingsTable} WHERE exam_group_id = ? LIMIT 1`, [context.examGroupId]);
    if (existing.length) {
      await database.query(`UPDATE ${examGroupSettingsTable} SET ? WHERE setting_id = ?`, [payload, existing[0].setting_id]);
    } else {
      await database.query(`INSERT INTO ${examGroupSettingsTable} SET ?`, [{ exam_group_id: context.examGroupId, ...payload }]);
    }

    const settings = await loadExamGroupSettings(database, context.examGroupId);
    return res.status(200).json({
      success: true,
      message: 'Exam settings saved successfully',
      data: settings
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function loadSubjectsForAssignments(connection, clientId, assignments) {
  if (!assignments.length) {
    return [];
  }

  const classroomIds = [...new Set(assignments.map((assignment) => assignment.classroom_id))];
  const [subjects] = await connection.query(`
    SELECT s.subject_id, s.classroom_id, s.sub_name, s.marks, c.name AS classroom_name
    FROM ${subjectsTable} s
    INNER JOIN ${classroomsTable} c ON c.classroom_id = s.classroom_id
    WHERE s.client_id = ? AND s.classroom_id IN (?)
    ORDER BY c.name ASC, s.sub_name ASC
  `, [clientId, classroomIds]);

  const byClassroom = new Map();
  subjects.forEach((subject) => {
    const list = byClassroom.get(subject.classroom_id) || [];
    list.push(subject);
    byClassroom.set(subject.classroom_id, list);
  });

  return assignments.flatMap((assignment) =>
    (byClassroom.get(assignment.classroom_id) || []).map((subject) => ({
      ...subject,
      section_id: assignment.section_id,
      section_name: assignment.section_name
    }))
  );
}

function nextExamSlot(cursor, endDate, settings) {
  const sessions = Number(settings.exams_per_day) === 2
    ? ['Morning', 'Afternoon']
    : ['Morning'];

  while (cursor.date <= endDate) {
    const isSunday = cursor.date.getDay() === 0;
    if (isSunday && !Number(settings.include_sunday)) {
      cursor.date = addDays(cursor.date, 1);
      cursor.sessionIndex = 0;
      continue;
    }

    const sessionName = sessions[cursor.sessionIndex];
    const startTime = sessionName === 'Afternoon' ? settings.afternoon_start_time : settings.morning_start_time;
    const slotDate = new Date(cursor.date);
    cursor.sessionIndex += 1;

    if (cursor.sessionIndex >= sessions.length) {
      cursor.date = addDays(cursor.date, 1);
      cursor.sessionIndex = 0;
    }

    return { exam_date: toDateKey(slotDate), session_name: sessionName, start_time: startTime };
  }

  return null;
}

async function buildTimetablePreview(clientId, examGroupId, selectedExamType = null) {
  const database = pool.promise();
  const group = await loadExamGroup(database, examGroupId, clientId);
  if (!group) {
    const error = new Error('Exam group not found');
    error.statusCode = 404;
    throw error;
  }

  const [assignments, settings] = await Promise.all([
    loadExamGroupAssignments(database, examGroupId, clientId),
    loadExamGroupSettings(database, examGroupId)
  ]);

  if (!assignments.length) {
    const error = new Error('Assign classes before generating timetable');
    error.statusCode = 400;
    throw error;
  }

  const subjects = await loadSubjectsForAssignments(database, clientId, assignments);
  if (!subjects.length) {
    const error = new Error('No subjects found for the assigned classes');
    error.statusCode = 400;
    throw error;
  }

  const startDate = new Date(toDateKey(group.start_date) || toDateKey(new Date()));
  const configuredEndDate = new Date(toDateKey(group.end_date) || toDateKey(startDate));
  const autoEndDate = addDays(startDate, Math.max(subjects.length * 2, 30));
  const endDate = configuredEndDate > autoEndDate ? configuredEndDate : autoEndDate;
  const cursor = { date: startDate, sessionIndex: 0 };
  const rows = [];
  const examType = normalizeExamType(selectedExamType, examTypeFromName(group.exam_name));

  for (const subject of subjects) {
    const slot = nextExamSlot(cursor, endDate, settings);
    if (!slot) {
      const error = new Error('Exam date range is too short for all assigned subjects. Extend end date or allow two exams per day.');
      error.statusCode = 400;
      throw error;
    }

    const totalMarks = subjectTotalMarks(subject, settings);
    rows.push({
      exam_group_id: examGroupId,
      classroom_id: subject.classroom_id,
      classroom_name: subject.classroom_name,
      section_id: subject.section_id,
      section_name: subject.section_name || 'All sections',
      subject_id: subject.subject_id,
      subject_name: subject.sub_name,
      exam_type: examType,
      academic_year: group.academic_year,
      exam_date: slot.exam_date,
      session_name: slot.session_name,
      start_time: slot.start_time,
      total_marks: totalMarks,
      passing_marks: passingMarksFromTotal(totalMarks),
      duration: Number(settings.default_duration || 180)
    });
  }

  return { group, settings, assignments, rows };
}

async function previewTimetable(req, res) {
  const clientId = clientIdFrom(req);
  const examGroupId = normalizePositiveInteger(req.params.examGroupId);
  if (!clientId || !examGroupId) {
    return res.status(400).json({ success: false, message: 'client_id and exam group id are required' });
  }

  try {
    const data = await buildTimetablePreview(clientId, examGroupId, examTypeFromRequest(req));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return sendDatabaseError(res, error);
  }
}

function normalizeTimetableEntries(body, previewRows) {
  const rawEntries = Array.isArray(body.entries) && body.entries.length ? body.entries : previewRows;
  const previewBySubject = new Map(previewRows.map((row) => [timetableEntryKey(row), row]));

  return rawEntries.map((entry) => {
    const previewRow = previewBySubject.get(timetableEntryKey(entry));

    return {
      classroom_id: normalizePositiveInteger(getValue(entry, 'classroomId', 'classroom_id')),
      section_id: normalizeOptionalPositiveInteger(getValue(entry, 'sectionId', 'section_id')),
      subject_id: normalizePositiveInteger(getValue(entry, 'subjectId', 'subject_id')),
      exam_type: normalizeExamType(getValue(entry, 'examType', 'exam_type') || previewRow?.exam_type, 'Other'),
      syllabus_unit_id: normalizeOptionalPositiveInteger(getValue(entry, 'syllabusUnitId', 'syllabus_unit_id')),
      academic_year: normalizeText(getValue(entry, 'academicYear', 'academic_year')),
      exam_date: normalizeDate(getValue(entry, 'examDate', 'exam_date')),
      total_marks: normalizeNonNegativeInteger(getValue(previewRow, 'totalMarks', 'total_marks')),
      passing_marks: normalizeNonNegativeInteger(getValue(previewRow, 'passingMarks', 'passing_marks')),
      duration: normalizeNonNegativeInteger(getValue(entry, 'duration')),
      session_name: getValue(entry, 'sessionName', 'session_name') === 'Afternoon' ? 'Afternoon' : 'Morning'
    };
  });
}

function timetableEntryKey(entry) {
  return [
    normalizePositiveInteger(getValue(entry, 'classroomId', 'classroom_id')) || '',
    normalizeOptionalPositiveInteger(getValue(entry, 'sectionId', 'section_id')) || '',
    normalizePositiveInteger(getValue(entry, 'subjectId', 'subject_id')) || ''
  ].join(':');
}

async function saveTimetable(req, res) {
  const clientId = clientIdFrom(req);
  const examGroupId = normalizePositiveInteger(req.params.examGroupId);
  if (!clientId || !examGroupId) {
    return res.status(400).json({ success: false, message: 'client_id and exam group id are required' });
  }

  const connection = await pool.promise().getConnection();

  try {
    const preview = await buildTimetablePreview(clientId, examGroupId, normalizeExamType(getValue(req.body, 'examType', 'exam_type'), null));
    const entries = normalizeTimetableEntries(req.body, preview.rows);

    if (!entries.length || entries.some((entry) => !entry.classroom_id || !entry.subject_id || !entry.exam_date || !entry.total_marks || !entry.passing_marks || !entry.duration)) {
      return res.status(400).json({ success: false, message: 'Complete timetable rows before saving' });
    }

    if (entries.some((entry) => entry.passing_marks > entry.total_marks)) {
      return res.status(400).json({ success: false, message: 'Passing marks cannot be greater than total marks' });
    }

    await connection.beginTransaction();
    const [[resultCount]] = await connection.query(`
      SELECT COUNT(er.exam_resu_id) AS count
      FROM ${examResultsTable} er
      INNER JOIN ${examsTable} e ON e.exam_id = er.exam_id
      WHERE e.exam_group_id = ? AND e.client_id = ?
    `, [examGroupId, clientId]);
    const [[ticketCount]] = await connection.query(`
      SELECT COUNT(*) AS count
      FROM ${examHallTicketsTable}
      WHERE exam_group_id = ? AND client_id = ? AND status = 'GENERATED'
    `, [examGroupId, clientId]);

    if (Number(resultCount.count || 0) > 0 || Number(ticketCount.count || 0) > 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'Timetable cannot be regenerated after hall tickets or marks are created.'
      });
    }

    await connection.query(`DELETE FROM ${examsTable} WHERE exam_group_id = ? AND client_id = ?`, [examGroupId, clientId]);
    await connection.query(`
      INSERT INTO ${examsTable} (
        client_id,
        subject_id,
        exam_type,
        syllabus_unit_id,
        academic_year,
        exam_date,
        total_marks,
        passing_marks,
        duration,
        exam_status,
        exam_group_id,
        classroom_id,
        section_id,
        session_name
      ) VALUES ?
    `, [entries.map((entry) => [
      clientId,
      entry.subject_id,
      entry.exam_type,
      entry.syllabus_unit_id,
      entry.academic_year || preview.group.academic_year,
      entry.exam_date,
      entry.total_marks,
      entry.passing_marks,
      entry.duration,
      'OPEN',
      examGroupId,
      entry.classroom_id,
      entry.section_id,
      entry.session_name
    ])]);
    await connection.query(
      `UPDATE ${examGroupsTable} SET status = CASE WHEN status = 'DRAFT' THEN 'ACTIVE' ELSE status END WHERE exam_group_id = ? AND client_id = ?`,
      [examGroupId, clientId]
    );
    await connection.commit();

    const timetable = await loadTimetable(pool.promise(), examGroupId, clientId);
    return res.status(201).json({
      success: true,
      message: 'Timetable saved successfully',
      data: timetable
    });
  } catch (error) {
    await connection.rollback();
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

async function loadTimetable(connection, examGroupId, clientId, filters = {}) {
  const conditions = ['e.exam_group_id = ?', 'e.client_id = ?'];
  const values = [examGroupId, clientId];
  const examType = normalizeExamType(filters.examType || filters.exam_type, null);

  if (examType) {
    conditions.push('e.exam_type = ?');
    values.push(examType);
  }

  const [rows] = await connection.query(`
    SELECT
      e.*,
      c.name AS classroom_name,
      sec.section_name,
      s.sub_name AS subject_name,
      (
        SELECT COUNT(*)
        FROM ${studentsTable} st
        WHERE st.client_id = e.client_id
          AND st.class_name = e.classroom_id
          AND st.enrollment_status = 'Active'
          AND (
            e.section_id IS NULL
            OR UPPER(TRIM(st.section)) = UPPER(TRIM(sec.section_name))
          )
      ) AS expected_result_count,
      (
        SELECT COUNT(DISTINCT er.student_id)
        FROM ${examResultsTable} er
        WHERE er.client_id = e.client_id
          AND er.exam_id = e.exam_id
      ) AS entered_result_count
    FROM ${examsTable} e
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = e.classroom_id
    LEFT JOIN ${sectionsTable} sec ON sec.section_id = e.section_id
    LEFT JOIN ${subjectsTable} s ON s.subject_id = e.subject_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY e.exam_date ASC, e.session_name ASC, c.name ASC, sec.section_name ASC, s.sub_name ASC
  `, values);

  return rows;
}

async function getTimetable(req, res) {
  try {
    const context = await validateExamGroup(req, res);
    if (!context) {
      return null;
    }

    const timetable = await loadTimetable(pool.promise(), context.examGroupId, context.clientId);
    return res.status(200).json({ success: true, data: timetable });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function loadSchoolBranding(connection, clientId) {
  const [rows] = await connection.query(
    `SELECT client_id, client_name, client_address, img, owner_name, mobile_number, email FROM ${clientMasterTable} WHERE client_id = ? LIMIT 1`,
    [clientId]
  );

  const row = rows[0] || {};
  return {
    school_name: row.client_name || 'School',
    school_address: row.client_address || '',
    school_logo_url: row.img || '',
    principal_signature: row.owner_name || 'Principal',
    phone_number: row.mobile_number || '',
    email: row.email || ''
  };
}

function hallTicketFilters(req) {
  return {
    classroomId: normalizeOptionalPositiveInteger(getValue(req.body, 'classroomId', 'classroom_id') || getValue(req.query, 'classroomId', 'classroom_id')),
    sectionId: normalizeOptionalPositiveInteger(getValue(req.body, 'sectionId', 'section_id') || getValue(req.query, 'sectionId', 'section_id')),
    studentId: normalizeOptionalPositiveInteger(getValue(req.body, 'studentId', 'student_id') || getValue(req.query, 'studentId', 'student_id')),
    examType: examTypeFromRequest(req)
  };
}

async function loadHallTicketStudents(connection, examGroupId, clientId, filters) {
  const conditions = [
    'st.client_id = ?',
    "st.enrollment_status = 'Active'",
    `EXISTS (
      SELECT 1
      FROM ${examGroupClassesTable} egc
      LEFT JOIN ${sectionsTable} egsec ON egsec.section_id = egc.section_id
      WHERE egc.exam_group_id = ?
        AND egc.client_id = ?
        AND egc.classroom_id = st.class_name
        AND (
          egc.section_id IS NULL
          OR UPPER(TRIM(st.section)) = UPPER(TRIM(egsec.section_name))
        )
    )`
  ];
  const values = [clientId, examGroupId, clientId];

  if (filters.classroomId) {
    conditions.push('st.class_name = ?');
    values.push(filters.classroomId);
  }

  if (filters.sectionId) {
    conditions.push('sec.section_id = ?');
    values.push(filters.sectionId);
  }

  if (filters.studentId) {
    conditions.push('st.student_id = ?');
    values.push(filters.studentId);
  }

  const [students] = await connection.query(`
    SELECT
      st.student_id,
      st.client_id,
      st.admission_number,
      CONCAT_WS(' ', st.first_name, st.middle_name, st.last_name) AS student_name,
      st.roll_number,
      st.father_name,
      st.class_name AS classroom_id,
      c.name AS classroom_name,
      st.section AS student_section,
      sec.section_id,
      sec.section_name,
      st.img AS student_photo
    FROM ${studentsTable} st
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = st.class_name
    LEFT JOIN ${sectionsTable} sec
      ON sec.classroom_id = st.class_name
      AND UPPER(TRIM(sec.section_name)) = UPPER(TRIM(st.section))
    WHERE ${conditions.join(' AND ')}
    ORDER BY c.name ASC, sec.section_name ASC, st.roll_number ASC, st.first_name ASC
  `, values);

  return students;
}

function timetableForStudent(timetable, student) {
  return timetable.filter((exam) =>
    Number(exam.classroom_id) === Number(student.classroom_id) &&
    (!exam.section_id || Number(exam.section_id) === Number(student.section_id))
  );
}

function buildHallTicketNo(group, student) {
  const year = String(group.academic_year || '').replace(/\D/g, '').slice(-4) || new Date().getFullYear();
  const admission = String(student.admission_number || student.student_id).replace(/[^a-zA-Z0-9]/g, '');
  return `HT-${year}-${group.exam_group_id}-${admission}`;
}

function mapHallTicket(group, school, student, timetable, savedTicket = {}) {
  const hallTicketNo = savedTicket.hall_ticket_no || buildHallTicketNo(group, student);
  return {
    hall_ticket_id: savedTicket.hall_ticket_id || null,
    hall_ticket_no: hallTicketNo,
    exam_group_id: group.exam_group_id,
    exam_name: group.exam_name,
    academic_year: group.academic_year,
    school,
    student: {
      student_id: student.student_id,
      admission_number: student.admission_number,
      student_name: student.student_name,
      father_name: student.father_name,
      roll_number: student.roll_number,
      classroom_id: student.classroom_id,
      classroom_name: student.classroom_name,
      section_id: student.section_id,
      section_name: student.section_name || student.student_section,
      student_photo: student.student_photo
    },
    timetable: timetableForStudent(timetable, student),
    qr_payload: `${hallTicketNo}|${group.exam_group_id}|${student.student_id}`
  };
}

async function buildHallTickets(examGroupId, clientId, filters) {
  const database = pool.promise();
  const group = await loadExamGroup(database, examGroupId, clientId);
  if (!group) {
    const error = new Error('Exam group not found');
    error.statusCode = 404;
    throw error;
  }

  const [school, timetable, students, savedTickets] = await Promise.all([
    loadSchoolBranding(database, clientId),
    loadTimetable(database, examGroupId, clientId, { examType: filters.examType }),
    loadHallTicketStudents(database, examGroupId, clientId, filters),
    loadHallTickets(database, examGroupId, clientId, filters)
  ]);

  if (!timetable.length) {
    const error = new Error('Generate timetable before hall tickets');
    error.statusCode = 400;
    throw error;
  }

  const savedTicketMap = new Map(savedTickets.map((ticket) => [String(ticket.student_id), ticket]));

  return students.map((student) => mapHallTicket(group, school, student, timetable, savedTicketMap.get(String(student.student_id))));
}

async function previewHallTickets(req, res) {
  const clientId = clientIdFrom(req);
  const examGroupId = normalizePositiveInteger(req.params.examGroupId);
  if (!clientId || !examGroupId) {
    return res.status(400).json({ success: false, message: 'client_id and exam group id are required' });
  }

  try {
    const tickets = await buildHallTickets(examGroupId, clientId, hallTicketFilters(req));
    return res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return sendDatabaseError(res, error);
  }
}

async function loadHallTickets(connection, examGroupId, clientId, filters) {
  const conditions = ['ht.exam_group_id = ?', 'ht.client_id = ?', "ht.status = 'GENERATED'"];
  const values = [examGroupId, clientId];

  if (filters.classroomId) {
    conditions.push('ht.classroom_id = ?');
    values.push(filters.classroomId);
  }

  if (filters.sectionId) {
    conditions.push('ht.section_id = ?');
    values.push(filters.sectionId);
  }

  if (filters.studentId) {
    conditions.push('ht.student_id = ?');
    values.push(filters.studentId);
  }

  const [rows] = await connection.query(`
    SELECT ht.*
    FROM ${examHallTicketsTable} ht
    WHERE ${conditions.join(' AND ')}
    ORDER BY ht.generated_at DESC
  `, values);

  return rows;
}

async function getHallTickets(req, res) {
  const clientId = clientIdFrom(req);
  const examGroupId = normalizePositiveInteger(req.params.examGroupId);
  if (!clientId || !examGroupId) {
    return res.status(400).json({ success: false, message: 'client_id and exam group id are required' });
  }

  try {
    const tickets = await buildHallTickets(examGroupId, clientId, hallTicketFilters(req));
    return res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return sendDatabaseError(res, error);
  }
}

async function generateHallTickets(req, res) {
  const clientId = clientIdFrom(req);
  const examGroupId = normalizePositiveInteger(req.params.examGroupId);
  if (!clientId || !examGroupId) {
    return res.status(400).json({ success: false, message: 'client_id and exam group id are required' });
  }

  const filters = hallTicketFilters(req);
  const connection = await pool.promise().getConnection();

  try {
    const tickets = await buildHallTickets(examGroupId, clientId, filters);
    if (!tickets.length) {
      return res.status(400).json({ success: false, message: 'No students found for hall tickets' });
    }

    await connection.beginTransaction();
    const deleteConditions = ['exam_group_id = ?', 'client_id = ?'];
    const deleteValues = [examGroupId, clientId];
    if (filters.classroomId) {
      deleteConditions.push('classroom_id = ?');
      deleteValues.push(filters.classroomId);
    }
    if (filters.sectionId) {
      deleteConditions.push('section_id = ?');
      deleteValues.push(filters.sectionId);
    }
    if (filters.studentId) {
      deleteConditions.push('student_id = ?');
      deleteValues.push(filters.studentId);
    }

    await connection.query(`DELETE FROM ${examHallTicketsTable} WHERE ${deleteConditions.join(' AND ')}`, deleteValues);
    await connection.query(`
      INSERT INTO ${examHallTicketsTable} (
        client_id,
        exam_group_id,
        student_id,
        classroom_id,
        section_id,
        hall_ticket_no,
        status,
        generated_by
      ) VALUES ?
    `, [tickets.map((ticket) => [
      clientId,
      examGroupId,
      ticket.student.student_id,
      ticket.student.classroom_id,
      ticket.student.section_id || null,
      ticket.hall_ticket_no,
      'GENERATED',
      loginIdFrom(req)
    ])]);
    await connection.commit();

    const generatedTickets = await buildHallTickets(examGroupId, clientId, filters);
    return res.status(201).json({
      success: true,
      message: 'Hall tickets generated successfully',
      data: generatedTickets
    });
  } catch (error) {
    await connection.rollback();
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

async function teacherCanAccessExam(connection, exam, teacherId) {
  if (!teacherId) {
    return false;
  }

  const [rows] = await connection.query(`
    SELECT assignment_id
    FROM ${teacherSubjectAssignmentsTable}
    WHERE client_id = ?
      AND classroom_id = ?
      AND subject_id = ?
      AND teacher_id = ?
      AND status = 'Active'
      AND (? IS NULL OR section_id = ?)
    LIMIT 1
  `, [exam.client_id, exam.classroom_id, exam.subject_id, teacherId, exam.section_id || null, exam.section_id || null]);

  return rows.length > 0;
}

async function loadMarksEntryExams(connection, clientId, examGroupId, req) {
  const filters = [];
  const values = [examGroupId, clientId];
  const examId = normalizeOptionalPositiveInteger(getValue(req.query, 'examId', 'exam_id') || getValue(req.body, 'examId', 'exam_id'));
  const classroomId = normalizeOptionalPositiveInteger(getValue(req.query, 'classroomId', 'classroom_id'));
  const sectionId = normalizeOptionalPositiveInteger(getValue(req.query, 'sectionId', 'section_id'));
  const examType = examTypeFromRequest(req);

  if (examId) {
    filters.push('e.exam_id = ?');
    values.push(examId);
  }

  if (classroomId) {
    filters.push('e.classroom_id = ?');
    values.push(classroomId);
  }

  if (sectionId) {
    filters.push('e.section_id = ?');
    values.push(sectionId);
  }

  if (examType) {
    filters.push('e.exam_type = ?');
    values.push(examType);
  }

  const [exams] = await connection.query(`
    SELECT
      e.*,
      c.name AS classroom_name,
      sec.section_name,
      s.sub_name AS subject_name
    FROM ${examsTable} e
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = e.classroom_id
    LEFT JOIN ${sectionsTable} sec ON sec.section_id = e.section_id
    LEFT JOIN ${subjectsTable} s ON s.subject_id = e.subject_id
    WHERE e.exam_group_id = ? AND e.client_id = ?
      ${filters.length ? `AND ${filters.join(' AND ')}` : ''}
    ORDER BY e.exam_date ASC, e.session_name ASC, c.name ASC, sec.section_name ASC, s.sub_name ASC
  `, values);

  if (isAdminDecoded(req.decoded || {})) {
    return exams;
  }

  if (!isTeacherDecoded(req.decoded || {})) {
    return [];
  }

  const teacherId = teacherIdFrom(req);
  const allowed = [];
  for (const exam of exams) {
    if (await teacherCanAccessExam(connection, exam, teacherId)) {
      allowed.push(exam);
    }
  }

  return allowed;
}

async function loadStudentsForExam(connection, clientId, exam) {
  const conditions = [
    'st.client_id = ?',
    'st.class_name = ?',
    "st.enrollment_status = 'Active'"
  ];
  const values = [clientId, exam.classroom_id];

  if (exam.section_id) {
    conditions.push('UPPER(TRIM(st.section)) = UPPER(TRIM(?))');
    values.push(exam.section_name || '');
  }

  const [students] = await connection.query(`
    SELECT
      st.student_id,
      st.admission_number,
      CONCAT_WS(' ', st.first_name, st.middle_name, st.last_name) AS student_name,
      st.roll_number,
      st.section,
      er.exam_resu_id,
      er.marks_obtained,
      er.status,
      er.remarks,
      er.grade
    FROM ${studentsTable} st
    LEFT JOIN ${examResultsTable} er ON er.exam_id = ? AND er.student_id = st.student_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY st.roll_number ASC, st.first_name ASC
  `, [exam.exam_id, ...values]);

  return students;
}

async function getMarksEntry(req, res) {
  try {
    const context = await validateExamGroup(req, res);
    if (!context) {
      return null;
    }

    const database = pool.promise();
    const exams = await loadMarksEntryExams(database, context.clientId, context.examGroupId, req);
    const requestedExamId = normalizeOptionalPositiveInteger(getValue(req.query, 'examId', 'exam_id') || getValue(req.body, 'examId', 'exam_id'));
    const selectedExam = requestedExamId
      ? exams[0] || null
      : exams.find((exam) => Number(exam.expected_result_count || 0) > Number(exam.entered_result_count || 0)) || null;
    const students = selectedExam ? await loadStudentsForExam(database, context.clientId, selectedExam) : [];

    return res.status(200).json({
      success: true,
      data: {
        exams,
        selected_exam: selectedExam,
        students
      }
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function saveMarksEntry(req, res) {
  const clientId = clientIdFrom(req);
  const examGroupId = normalizePositiveInteger(req.params.examGroupId);
  const examId = normalizePositiveInteger(getValue(req.body, 'examId', 'exam_id'));
  const rows = Array.isArray(req.body.rows) ? req.body.rows : [];

  if (!clientId || !examGroupId || !examId || !rows.length) {
    return res.status(400).json({ success: false, message: 'client_id, exam, and marks rows are required' });
  }

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();
    const [exams] = await connection.query(`
      SELECT
        e.*,
        sec.section_name
      FROM ${examsTable} e
      LEFT JOIN ${sectionsTable} sec ON sec.section_id = e.section_id
      WHERE e.exam_id = ? AND e.exam_group_id = ? AND e.client_id = ?
      LIMIT 1
    `, [examId, examGroupId, clientId]);
    const exam = exams[0];

    if (!exam) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Exam not found for marks entry' });
    }

    if (!isAdminDecoded(req.decoded || {}) && !(isTeacherDecoded(req.decoded || {}) && await teacherCanAccessExam(connection, exam, teacherIdFrom(req)))) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Teacher can enter marks only for assigned class, section, and subject' });
    }

    if (exam.exam_status === 'CLOSED') {
      await connection.rollback();
      return res.status(409).json({ success: false, message: 'Exam is closed. Marks cannot be changed.' });
    }

    for (const row of rows) {
      const studentId = normalizePositiveInteger(getValue(row, 'studentId', 'student_id'));
      const absent = normalizeBoolean(row.absent);
      const marksObtained = absent ? 0 : normalizeNonNegativeInteger(getValue(row, 'marksObtained', 'marks_obtained'));
      const remarks = normalizeText(row.remarks);

      if (!studentId || marksObtained === null) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Each marks row needs a student and marks value' });
      }

      if (!absent && marksObtained > Number(exam.total_marks)) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Marks obtained cannot be greater than total marks' });
      }

      const [students] = await connection.query(`
        SELECT student_id
        FROM ${studentsTable}
        WHERE student_id = ?
          AND client_id = ?
          AND class_name = ?
          AND enrollment_status = 'Active'
          AND (? IS NULL OR UPPER(TRIM(section)) = UPPER(TRIM(?)))
        LIMIT 1
      `, [studentId, clientId, exam.classroom_id, exam.section_name || null, exam.section_name || null]);

      if (!students.length) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Choose valid students for the selected exam' });
      }

      const status = passFailStatus(marksObtained, exam.passing_marks, absent);
      const grade = absent ? null : gradeFromPercentage((marksObtained / Number(exam.total_marks || 1)) * 100);
      const [existing] = await connection.query(
        `SELECT exam_resu_id FROM ${examResultsTable} WHERE exam_id = ? AND student_id = ? AND client_id = ? LIMIT 1`,
        [examId, studentId, clientId]
      );
      const payload = {
        client_id: clientId,
        exam_id: examId,
        student_id: studentId,
        marks_obtained: marksObtained,
        status,
        subject_id: exam.subject_id,
        max_marks: exam.total_marks,
        passing_marks: exam.passing_marks,
        grade,
        remarks,
        entered_by: loginIdFrom(req)
      };

      if (existing.length) {
        await connection.query(`UPDATE ${examResultsTable} SET ? WHERE exam_resu_id = ?`, [payload, existing[0].exam_resu_id]);
      } else {
        await connection.query(`INSERT INTO ${examResultsTable} SET ?`, payload);
      }
    }

    const classProgressRows = await loadReadyReportProgress(connection, clientId, [examGroupId]);
    const { readyClassroomMap, readyClassReportMap } = buildReadyReportMaps(classProgressRows);
    const readyClassReports = readyClassReportMap.get(examGroupId) || [];
    const saveData = {
      exam_group_id: examGroupId,
      class_report_ready_count: readyClassReports.length,
      ready_classroom_ids: readyClassroomMap.get(examGroupId) || [],
      ready_class_reports: readyClassReports
    };

    await connection.commit();
    return res.status(200).json({
      success: true,
      message: 'Marks saved successfully',
      data: saveData
    });
  } catch (error) {
    await connection.rollback();
    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

async function loadResultRows(connection, clientId, examGroupId, filters = {}) {
  const conditions = ['e.exam_group_id = ?', 'e.client_id = ?', 'er.client_id = ?'];
  const values = [examGroupId, clientId, clientId];
  const examType = normalizeExamType(filters.examType || filters.exam_type, null);
  const classroomId = normalizeOptionalPositiveInteger(filters.classroomId || filters.classroom_id);
  const sectionId = normalizeOptionalPositiveInteger(filters.sectionId || filters.section_id);
  const examId = normalizeOptionalPositiveInteger(filters.examId || filters.exam_id);

  if (examType) {
    conditions.push('e.exam_type = ?');
    values.push(examType);
  }

  if (classroomId) {
    conditions.push('e.classroom_id = ?');
    values.push(classroomId);
  }

  if (sectionId) {
    conditions.push('e.section_id = ?');
    values.push(sectionId);
  }

  if (examId) {
    conditions.push('e.exam_id = ?');
    values.push(examId);
  }

  const [rows] = await connection.query(`
    SELECT
      er.*,
      e.exam_group_id,
      e.exam_type,
      e.classroom_id,
      e.section_id,
      e.subject_id AS exam_subject_id,
      e.total_marks AS exam_total_marks,
      e.passing_marks AS exam_passing_marks,
      e.exam_date,
      c.name AS classroom_name,
      sec.section_name,
      s.sub_name AS subject_name,
      st.admission_number,
      st.roll_number,
      CONCAT_WS(' ', st.first_name, st.middle_name, st.last_name) AS student_name
    FROM ${examResultsTable} er
    INNER JOIN ${examsTable} e ON e.exam_id = er.exam_id AND e.client_id = er.client_id
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = e.classroom_id
    LEFT JOIN ${sectionsTable} sec ON sec.section_id = e.section_id
    LEFT JOIN ${subjectsTable} s ON s.subject_id = e.subject_id
    LEFT JOIN ${studentsTable} st ON st.student_id = er.student_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY c.name ASC, sec.section_name ASC, st.roll_number ASC, s.sub_name ASC
  `, values);

  return rows;
}

function resultFiltersFromRequest(req) {
  return {
    examType: examTypeFromRequest(req),
    classroomId: getValue(req.body, 'classroomId', 'classroom_id') || getValue(req.query, 'classroomId', 'classroom_id'),
    sectionId: getValue(req.body, 'sectionId', 'section_id') || getValue(req.query, 'sectionId', 'section_id'),
    examId: getValue(req.body, 'examId', 'exam_id') || getValue(req.query, 'examId', 'exam_id')
  };
}

function computeResultSummary(rows) {
  const studentMap = new Map();
  const subjectMap = new Map();
  const absentRows = [];

  rows.forEach((row) => {
    const studentKey = String(row.student_id);
    const maxMarks = Number(row.max_marks || row.exam_total_marks || 0);
    const marks = row.status === 'ABSENT' ? 0 : Number(row.marks_obtained || 0);
    const student = studentMap.get(studentKey) || {
      student_id: row.student_id,
      admission_number: row.admission_number,
      roll_number: row.roll_number,
      student_name: row.student_name,
      classroom_id: row.classroom_id,
      classroom_name: row.classroom_name,
      section_id: row.section_id,
      section_name: row.section_name,
      total_marks: 0,
      max_marks: 0,
      percentage: 0,
      grade: '',
      status: 'PASS',
      class_rank: null,
      section_rank: null,
      subjects: []
    };
    const status = row.status === 'ABSENT'
      ? 'ABSENT'
      : Number(row.marks_obtained || 0) >= Number(row.passing_marks || row.exam_passing_marks || 0) ? 'PASS' : 'FAIL';

    student.total_marks += marks;
    student.max_marks += maxMarks;
    if (status !== 'PASS') {
      student.status = 'FAIL';
    }
    student.subjects.push({
      exam_id: row.exam_id,
      subject_id: row.subject_id || row.exam_subject_id,
      subject_name: row.subject_name,
      exam_type: row.exam_type,
      marks_obtained: marks,
      max_marks: maxMarks,
      passing_marks: Number(row.passing_marks || row.exam_passing_marks || 0),
      status,
      grade: row.grade,
      remarks: row.remarks
    });
    studentMap.set(studentKey, student);

    const subjectKey = String(row.subject_id || row.exam_subject_id);
    const subject = subjectMap.get(subjectKey) || {
      subject_id: row.subject_id || row.exam_subject_id,
      subject_name: row.subject_name,
      appeared: 0,
      passed: 0,
      failed: 0,
      absent: 0,
      average_marks: 0,
      total_marks: 0
    };

    if (status === 'ABSENT') {
      subject.absent += 1;
      absentRows.push(row);
    } else {
      subject.appeared += 1;
      subject.total_marks += marks;
      if (status === 'PASS') {
        subject.passed += 1;
      } else {
        subject.failed += 1;
      }
    }
    subjectMap.set(subjectKey, subject);
  });

  const summaries = Array.from(studentMap.values()).map((student) => {
    const percentage = student.max_marks ? (student.total_marks / student.max_marks) * 100 : 0;
    return {
      ...student,
      percentage: Math.round(percentage * 100) / 100,
      grade: gradeFromPercentage(percentage)
    };
  });

  assignRanks(summaries, (row) => String(row.classroom_id || 'class'), 'class_rank');
  assignRanks(summaries, (row) => `${row.classroom_id || 'class'}:${row.section_id || row.section_name || 'section'}`, 'section_rank');

  const subjects = Array.from(subjectMap.values()).map((subject) => ({
    ...subject,
    average_marks: subject.appeared ? Math.round((subject.total_marks / subject.appeared) * 100) / 100 : 0
  }));

  return {
    students: summaries,
    subjects,
    toppers: summaries.filter((row) => row.status === 'PASS').sort(scoreSort).slice(0, 10),
    failed_students: summaries.filter((row) => row.status !== 'PASS'),
    absent_students: absentRows
  };
}

function assignRanks(rows, keyFn, rankField) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = keyFn(row);
    const list = groups.get(key) || [];
    list.push(row);
    groups.set(key, list);
  });

  groups.forEach((groupRows) => {
    groupRows.sort(scoreSort).forEach((row, index) => {
      row[rankField] = index + 1;
    });
  });
}

function scoreSort(first, second) {
  return second.percentage - first.percentage || second.total_marks - first.total_marks || String(first.student_name || '').localeCompare(String(second.student_name || ''));
}

async function processResults(req, res) {
  try {
    const context = await validateExamGroup(req, res);
    if (!context) {
      return null;
    }

    const connection = await pool.promise().getConnection();
    try {
      await connection.beginTransaction();
      const filters = resultFiltersFromRequest(req);
      const rows = await loadResultRows(connection, context.clientId, context.examGroupId, filters);
      if (!rows.length) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: 'Enter marks before processing results' });
      }

      for (const row of rows) {
        const absent = row.status === 'ABSENT';
        const maxMarks = Number(row.max_marks || row.exam_total_marks || 0);
        const marks = absent ? 0 : Number(row.marks_obtained || 0);
        const status = passFailStatus(marks, row.passing_marks || row.exam_passing_marks, absent);
        const grade = absent ? null : gradeFromPercentage(maxMarks ? (marks / maxMarks) * 100 : 0);
        await connection.query(`
          UPDATE ${examResultsTable}
          SET status = ?, grade = ?, subject_id = COALESCE(subject_id, ?), max_marks = ?, passing_marks = ?
          WHERE exam_resu_id = ?
        `, [status, grade, row.exam_subject_id, maxMarks, Number(row.passing_marks || row.exam_passing_marks || 0), row.exam_resu_id]);
      }
      const isPartialProcessing = normalizeOptionalPositiveInteger(filters.classroomId)
        || normalizeOptionalPositiveInteger(filters.sectionId)
        || normalizeOptionalPositiveInteger(filters.examId)
        || normalizeExamType(filters.examType, null);
      if (!isPartialProcessing) {
        await connection.query(`UPDATE ${examGroupsTable} SET status = 'COMPLETED' WHERE exam_group_id = ? AND client_id = ?`, [context.examGroupId, context.clientId]);
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const rows = await loadResultRows(pool.promise(), context.clientId, context.examGroupId, resultFiltersFromRequest(req));
    return res.status(200).json({
      success: true,
      message: 'Results processed successfully',
      data: computeResultSummary(rows)
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function publishResults(req, res) {
  try {
    const context = await validateExamGroup(req, res);
    if (!context) {
      return null;
    }

    await pool.promise().query(
      `UPDATE ${examGroupsTable} SET status = 'PUBLISHED' WHERE exam_group_id = ? AND client_id = ?`,
      [context.examGroupId, context.clientId]
    );

    return res.status(200).json({ success: true, message: 'Results published successfully' });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function getReports(req, res) {
  try {
    const context = await validateExamGroup(req, res);
    if (!context) {
      return null;
    }

    const reportType = normalizeText(req.query.type, 'progress_card');
    const rows = await loadResultRows(pool.promise(), context.clientId, context.examGroupId, resultFiltersFromRequest(req));
    const summary = computeResultSummary(rows);
    const payload = {
      report_type: reportType,
      exam_group: context.group,
      generated_at: new Date(),
      ...summary
    };

    return res.status(200).json({ success: true, data: payload });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

module.exports = {
  requireExamAdmin,
  getDashboard,
  getExamGroups,
  getExamGroupById,
  createExamGroup,
  updateExamGroup,
  deleteExamGroup,
  saveExamGroupClasses,
  saveExamGroupSettings,
  previewTimetable,
  getTimetable,
  saveTimetable,
  previewHallTickets,
  getHallTickets,
  generateHallTickets,
  getMarksEntry,
  saveMarksEntry,
  processResults,
  publishResults,
  getReports
};
