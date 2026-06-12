const { pool } = require('../config');
const { classroomOrderSql } = require('./classroom-order');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || process.env.DB_DATABASE || 'school';
const tableCache = new Map();
const DEFAULT_SESSION_NAME = 'Regular Day';
const DEFAULT_SESSION_PERIODS = [
  { period_number: 1, label: 'Period 1', start_time: '09:00:00', end_time: '09:45:00', duration_minutes: 45 },
  { period_number: 2, label: 'Period 2', start_time: '09:45:00', end_time: '10:30:00', duration_minutes: 45 },
  { period_number: 3, label: 'Period 3', start_time: '10:45:00', end_time: '11:30:00', duration_minutes: 45 },
  { period_number: 4, label: 'Period 4', start_time: '11:30:00', end_time: '12:15:00', duration_minutes: 45 },
  { period_number: 5, label: 'Period 5', start_time: '13:00:00', end_time: '13:45:00', duration_minutes: 45 },
  { period_number: 6, label: 'Period 6', start_time: '13:45:00', end_time: '14:30:00', duration_minutes: 45 },
  { period_number: 7, label: 'Period 7', start_time: '14:45:00', end_time: '15:30:00', duration_minutes: 45 },
  { period_number: 8, label: 'Period 8', start_time: '15:30:00', end_time: '16:15:00', duration_minutes: 45 }
];

function escapeIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``;
}

function table(name) {
  return `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier(name)}`;
}

function database() {
  return pool.promise();
}

async function getColumns(tableName) {
  if (tableCache.has(tableName)) {
    return tableCache.get(tableName);
  }

  const [rows] = await database().query(`SHOW COLUMNS FROM ${table(tableName)}`);
  const columns = rows.map((row) => ({
    field: row.Field,
    type: String(row.Type || '').toLowerCase(),
    key: row.Key
  }));
  const meta = {
    columns,
    names: new Set(columns.map((column) => column.field))
  };

  tableCache.set(tableName, meta);
  return meta;
}

function hasColumn(meta, column) {
  return meta.names.has(column);
}

function firstColumn(meta, candidates) {
  return candidates.find((candidate) => hasColumn(meta, candidate)) || null;
}

function primaryColumn(meta, candidates) {
  return firstColumn(meta, candidates) || meta.columns.find((column) => column.key === 'PRI')?.field || candidates[0];
}

function columnSql(alias, column) {
  return `${alias}.${escapeIdentifier(column)}`;
}

function optionalColumn(meta, alias, column, aliasName) {
  return hasColumn(meta, column)
    ? `${columnSql(alias, column)} AS ${escapeIdentifier(aliasName || column)}`
    : `NULL AS ${escapeIdentifier(aliasName || column)}`;
}

function firstDisplayColumn(meta, alias, candidates, fallback = 'NULL') {
  const column = firstColumn(meta, candidates);
  return column ? columnSql(alias, column) : fallback;
}

function teacherNameExpression(meta, alias = 't') {
  const nameColumn = firstColumn(meta, ['name', 'teacher_name', 'full_name']);
  if (nameColumn) {
    return columnSql(alias, nameColumn);
  }

  const parts = ['first_name', 'middle_name', 'last_name']
    .filter((column) => hasColumn(meta, column))
    .map((column) => columnSql(alias, column));

  return parts.length ? `TRIM(CONCAT_WS(' ', ${parts.join(', ')}))` : 'NULL';
}

function dayExpression(meta, alias = 'cs') {
  const dayColumn = meta.columns.find((column) => column.field === 'day_of_week');
  if (!dayColumn) {
    return 'NULL';
  }

  if (dayColumn.type.includes('int')) {
    return `
      CASE ${columnSql(alias, 'day_of_week')}
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
        WHEN 7 THEN 'Sunday'
        ELSE CAST(${columnSql(alias, 'day_of_week')} AS CHAR)
      END
    `;
  }

  return columnSql(alias, 'day_of_week');
}

function sendDatabaseError(res, error) {
  return res.status(500).json({
    success: false,
    message: 'Database error',
    error: error.message
  });
}

function asyncHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      sendDatabaseError(res, error);
    }
  };
}

function getValue(source, camelKey, snakeKey = camelKey, fallback = undefined) {
  if (source[camelKey] !== undefined) {
    return source[camelKey];
  }

  if (source[snakeKey] !== undefined) {
    return source[snakeKey];
  }

  return fallback;
}

function normalizePositiveInteger(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed || null;
}

function normalizeStatus(value, fallback = 'Active') {
  const normalized = normalizeString(value) || fallback;
  const allowed = new Set(['Active', 'Inactive', 'Cancelled']);
  const match = [...allowed].find((status) => status.toLowerCase() === normalized.toLowerCase());
  return match || fallback;
}

function normalizeDate(value) {
  const normalized = normalizeString(value);
  return normalized || null;
}

function normalizeDayInput(value) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return null;
  }

  const day = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
  const allowed = new Set(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
  return allowed.has(day) ? day : normalized;
}

function normalizeDayForColumn(value, scheduleMeta) {
  const normalized = normalizeDayInput(value);
  if (!normalized) {
    return null;
  }

  const dayColumn = scheduleMeta.columns.find((column) => column.field === 'day_of_week');
  if (!dayColumn?.type.includes('int')) {
    return normalized;
  }

  const map = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7
  };

  return map[normalized] || normalizePositiveInteger(normalized);
}

function clientIdFrom(req) {
  return normalizePositiveInteger(
    getValue(req.body || {}, 'clientId', 'client_id') ||
      getValue(req.query || {}, 'clientId', 'client_id') ||
      req.decoded?.client_id ||
      req.decoded?.clientId
  );
}

function pickPayload(meta, payload) {
  return Object.entries(payload).reduce((acc, [key, value]) => {
    if (hasColumn(meta, key) && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
}

async function insertRow(tableName, payload) {
  const columns = Object.keys(payload);
  const placeholders = columns.map(() => '?').join(', ');
  const sql = `
    INSERT INTO ${table(tableName)} (${columns.map(escapeIdentifier).join(', ')})
    VALUES (${placeholders})
  `;
  const [result] = await database().query(sql, columns.map((column) => payload[column]));
  return result.insertId;
}

async function updateRow(tableName, idColumn, id, payload) {
  const columns = Object.keys(payload);
  const setClause = columns.map((column) => `${escapeIdentifier(column)} = ?`).join(', ');
  const sql = `UPDATE ${table(tableName)} SET ${setClause} WHERE ${escapeIdentifier(idColumn)} = ?`;
  const [result] = await database().query(sql, [...columns.map((column) => payload[column]), id]);
  return result.affectedRows;
}

async function deleteRow(tableName, idColumn, id) {
  const [result] = await database().query(
    `DELETE FROM ${table(tableName)} WHERE ${escapeIdentifier(idColumn)} = ?`,
    [id]
  );
  return result.affectedRows;
}

async function findById(tableName, idColumn, id) {
  const [rows] = await database().query(
    `SELECT * FROM ${table(tableName)} WHERE ${escapeIdentifier(idColumn)} = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function existsById(tableName, idColumn, id, extra = []) {
  const where = [`${escapeIdentifier(idColumn)} = ?`];
  const values = [id];

  extra.forEach((condition) => {
    where.push(condition.sql);
    values.push(...condition.values);
  });

  const [rows] = await database().query(
    `SELECT ${escapeIdentifier(idColumn)} FROM ${table(tableName)} WHERE ${where.join(' AND ')} LIMIT 1`,
    values
  );
  return rows.length > 0;
}

async function getTableBasics() {
  const [assignmentMeta, scheduleMeta, sectionsMeta, classroomsMeta, subjectsMeta, teachersMeta, periodsMeta] =
    await Promise.all([
      getColumns('teacher_subject_assignments'),
      getColumns('class_schedule'),
      getColumns('sections'),
      getColumns('classrooms'),
      getColumns('subjects'),
      getColumns('teachers'),
      getColumns('session_periods')
    ]);

  return {
    assignmentMeta,
    assignmentId: primaryColumn(assignmentMeta, ['id', 'assignment_id', 'teacher_subject_assignment_id']),
    scheduleMeta,
    scheduleId: primaryColumn(scheduleMeta, ['id', 'schedule_id', 'class_schedule_id']),
    sectionsMeta,
    sectionId: primaryColumn(sectionsMeta, ['section_id', 'id']),
    classroomsMeta,
    classroomId: primaryColumn(classroomsMeta, ['classroom_id', 'id']),
    subjectsMeta,
    subjectId: primaryColumn(subjectsMeta, ['subject_id', 'id']),
    teachersMeta,
    teacherId: primaryColumn(teachersMeta, ['teacher_id', 'id']),
    periodsMeta,
    periodId: primaryColumn(periodsMeta, ['period_id', 'id'])
  };
}

function sessionNameColumn(sessionsMeta) {
  return firstColumn(sessionsMeta, ['name', 'session_name', 'label']);
}

async function findSessionByName(name, nameColumn) {
  const [rows] = await database().query(
    `
      SELECT *
      FROM ${table('school_sessions')}
      WHERE LOWER(${escapeIdentifier(nameColumn)}) = LOWER(?)
      LIMIT 1
    `,
    [name]
  );

  return rows[0] || null;
}

async function ensureSession(name) {
  const sessionsMeta = await getColumns('school_sessions');
  const sessionId = primaryColumn(sessionsMeta, ['session_id', 'id']);
  const nameColumn = sessionNameColumn(sessionsMeta);

  if (!nameColumn) {
    throw new Error('school_sessions table must have a name, session_name, or label column.');
  }

  const normalizedName = normalizeString(name) || DEFAULT_SESSION_NAME;
  const existing = await findSessionByName(normalizedName, nameColumn);

  if (existing) {
    if (hasColumn(sessionsMeta, 'is_active') && Number(existing.is_active) !== 1) {
      await updateRow('school_sessions', sessionId, existing[sessionId], { is_active: 1 });
    }

    return existing[sessionId];
  }

  return insertRow('school_sessions', pickPayload(sessionsMeta, {
    [nameColumn]: normalizedName,
    sort_order: 1,
    is_active: 1
  }));
}

async function validateSectionBelongs(sectionId, classroomId, basics) {
  if (!hasColumn(basics.sectionsMeta, 'classroom_id')) {
    return existsById('sections', basics.sectionId, sectionId);
  }

  return existsById('sections', basics.sectionId, sectionId, [
    { sql: `${escapeIdentifier('classroom_id')} = ?`, values: [classroomId] }
  ]);
}

async function validateAssignmentReferences(payload, basics) {
  if (!payload.classroom_id || !payload.section_id || !payload.subject_id || !payload.teacher_id) {
    return 'Classroom, section, subject, and teacher are required.';
  }

  const [classroomExists, sectionBelongs, subjectExists, teacherExists] = await Promise.all([
    existsById('classrooms', basics.classroomId, payload.classroom_id),
    validateSectionBelongs(payload.section_id, payload.classroom_id, basics),
    existsById('subjects', basics.subjectId, payload.subject_id),
    existsById('teachers', basics.teacherId, payload.teacher_id)
  ]);

  if (!classroomExists || !subjectExists || !teacherExists) {
    return 'Teacher, subject, classroom, and section must exist.';
  }

  if (!sectionBelongs) {
    return 'Section must belong to selected classroom.';
  }

  return null;
}

async function validateScheduleReferences(payload, basics) {
  if (
    !payload.classroom_id ||
    !payload.section_id ||
    !payload.subject_id ||
    !payload.teacher_id ||
    !payload.period_id ||
    !payload.day_of_week
  ) {
    return 'Classroom, section, subject, teacher, period, and day are required.';
  }

  const referenceError = await validateAssignmentReferences(payload, basics);
  if (referenceError) {
    return referenceError;
  }

  const periodExists = await existsById('session_periods', basics.periodId, payload.period_id);
  if (!periodExists) {
    return 'Period must exist in session periods.';
  }

  return null;
}

async function ensureSingleActiveTeacher(payload, basics, ignoreId = null) {
  if (payload.status !== 'Active') {
    return null;
  }

  const where = [
    'classroom_id = ?',
    'section_id = ?',
    'subject_id = ?',
    'status = ?'
  ];
  const values = [payload.classroom_id, payload.section_id, payload.subject_id, 'Active'];

  if (ignoreId) {
    where.push(`${escapeIdentifier(basics.assignmentId)} <> ?`);
    values.push(ignoreId);
  }

  const [rows] = await database().query(
    `
      SELECT ${escapeIdentifier(basics.assignmentId)}
      FROM ${table('teacher_subject_assignments')}
      WHERE ${where.join(' AND ')}
      LIMIT 1
    `,
    values
  );

  return rows.length ? 'One class + section + subject should have only one active teacher.' : null;
}

async function validateTeacherSubjectAssignment(payload, basics) {
  const [rows] = await database().query(
    `
      SELECT ${escapeIdentifier(basics.assignmentId)}
      FROM ${table('teacher_subject_assignments')}
      WHERE classroom_id = ?
        AND section_id = ?
        AND subject_id = ?
        AND teacher_id = ?
        AND status = 'Active'
      LIMIT 1
    `,
    [payload.classroom_id, payload.section_id, payload.subject_id, payload.teacher_id]
  );

  return rows.length ? null : 'This teacher is not assigned to teach this subject for this class.';
}

async function validateClassConflict(payload, basics, ignoreId = null) {
  if (payload.status !== 'Active') {
    return null;
  }

  const where = [
    'classroom_id = ?',
    'section_id = ?',
    'period_id = ?',
    'day_of_week = ?',
    'status = ?'
  ];
  const values = [payload.classroom_id, payload.section_id, payload.period_id, payload.day_of_week, 'Active'];

  if (ignoreId) {
    where.push(`${escapeIdentifier(basics.scheduleId)} <> ?`);
    values.push(ignoreId);
  }

  const [rows] = await database().query(
    `
      SELECT ${escapeIdentifier(basics.scheduleId)}
      FROM ${table('class_schedule')}
      WHERE ${where.join(' AND ')}
      LIMIT 1
    `,
    values
  );

  return rows.length ? 'This class already has a subject assigned for this period.' : null;
}

async function validateTeacherConflict(payload, basics, ignoreId = null) {
  if (payload.status !== 'Active') {
    return null;
  }

  const where = [
    'teacher_id = ?',
    'period_id = ?',
    'day_of_week = ?',
    'status = ?'
  ];
  const values = [payload.teacher_id, payload.period_id, payload.day_of_week, 'Active'];

  if (ignoreId) {
    where.push(`${escapeIdentifier(basics.scheduleId)} <> ?`);
    values.push(ignoreId);
  }

  const [rows] = await database().query(
    `
      SELECT ${escapeIdentifier(basics.scheduleId)}
      FROM ${table('class_schedule')}
      WHERE ${where.join(' AND ')}
      LIMIT 1
    `,
    values
  );

  return rows.length ? 'This teacher is already assigned to another class for this period.' : null;
}

async function hydrateLegacyScheduleColumns(payload, basics) {
  if (hasColumn(basics.scheduleMeta, 'session_id') && !payload.session_id) {
    const [periods] = await database().query(
      `SELECT session_id FROM ${table('session_periods')} WHERE ${escapeIdentifier(basics.periodId)} = ? LIMIT 1`,
      [payload.period_id]
    );
    payload.session_id = periods[0]?.session_id || null;
  }

  if (hasColumn(basics.scheduleMeta, 'subject') && !hasColumn(basics.scheduleMeta, 'subject_id')) {
    const nameColumn = firstColumn(basics.subjectsMeta, ['sub_name', 'subject_name', 'name']);
    if (nameColumn) {
      const [subjects] = await database().query(
        `SELECT ${escapeIdentifier(nameColumn)} AS name FROM ${table('subjects')} WHERE ${escapeIdentifier(basics.subjectId)} = ? LIMIT 1`,
        [payload.subject_id]
      );
      payload.subject = subjects[0]?.name || null;
    }
  }

  if (hasColumn(basics.scheduleMeta, 'section') && !hasColumn(basics.scheduleMeta, 'section_id')) {
    const nameColumn = firstColumn(basics.sectionsMeta, ['name', 'section_name', 'section', 'label']);
    if (nameColumn) {
      const [sections] = await database().query(
        `SELECT ${escapeIdentifier(nameColumn)} AS name FROM ${table('sections')} WHERE ${escapeIdentifier(basics.sectionId)} = ? LIMIT 1`,
        [payload.section_id]
      );
      payload.section = sections[0]?.name || null;
    }
  }

  return payload;
}

function buildAssignmentPayload(req, basics, existing = {}) {
  const body = req.body || {};
  const clientId = clientIdFrom(req);
  const payload = {
    client_id: clientId || existing.client_id,
    classroom_id: normalizePositiveInteger(getValue(body, 'classroomId', 'classroom_id', existing.classroom_id)),
    section_id: normalizePositiveInteger(getValue(body, 'sectionId', 'section_id', existing.section_id)),
    subject_id: normalizePositiveInteger(getValue(body, 'subjectId', 'subject_id', existing.subject_id)),
    teacher_id: normalizePositiveInteger(getValue(body, 'teacherId', 'teacher_id', existing.teacher_id)),
    status: normalizeStatus(getValue(body, 'status', 'status', existing.status || 'Active'))
  };

  return pickPayload(basics.assignmentMeta, payload);
}

function buildSchedulePayload(req, basics, existing = {}) {
  const body = req.body || {};
  const clientId = clientIdFrom(req);
  const payload = {
    client_id: clientId || existing.client_id,
    classroom_id: normalizePositiveInteger(getValue(body, 'classroomId', 'classroom_id', existing.classroom_id)),
    section_id: normalizePositiveInteger(getValue(body, 'sectionId', 'section_id', existing.section_id)),
    subject_id: normalizePositiveInteger(getValue(body, 'subjectId', 'subject_id', existing.subject_id)),
    teacher_id: normalizePositiveInteger(getValue(body, 'teacherId', 'teacher_id', existing.teacher_id)),
    period_id: normalizePositiveInteger(getValue(body, 'periodId', 'period_id', existing.period_id)),
    day_of_week: normalizeDayForColumn(getValue(body, 'dayOfWeek', 'day_of_week', existing.day_of_week), basics.scheduleMeta),
    schedule_date: normalizeDate(getValue(body, 'scheduleDate', 'schedule_date', existing.schedule_date)),
    status: normalizeStatus(getValue(body, 'status', 'status', existing.status || 'Active')),
    notes: normalizeString(getValue(body, 'notes', 'notes', existing.notes))
  };

  return payload;
}

function assignmentSelectSql(basics) {
  const sectionName = firstDisplayColumn(basics.sectionsMeta, 'sec', ['name', 'section_name', 'section', 'label']);
  const subjectName = firstDisplayColumn(basics.subjectsMeta, 's', ['sub_name', 'subject_name', 'name']);

  return `
    SELECT
      tsa.${escapeIdentifier(basics.assignmentId)} AS id,
      tsa.${escapeIdentifier(basics.assignmentId)} AS assignment_id,
      ${optionalColumn(basics.assignmentMeta, 'tsa', 'client_id')},
      tsa.classroom_id,
      c.name AS classroom_name,
      tsa.section_id,
      ${sectionName} AS section_name,
      tsa.subject_id,
      ${subjectName} AS subject_name,
      tsa.teacher_id,
      ${teacherNameExpression(basics.teachersMeta, 't')} AS teacher_name,
      tsa.status,
      ${optionalColumn(basics.assignmentMeta, 'tsa', 'created_at')},
      ${optionalColumn(basics.assignmentMeta, 'tsa', 'updated_at')}
    FROM ${table('teacher_subject_assignments')} tsa
    LEFT JOIN ${table('classrooms')} c ON c.${escapeIdentifier(basics.classroomId)} = tsa.classroom_id
    LEFT JOIN ${table('sections')} sec ON sec.${escapeIdentifier(basics.sectionId)} = tsa.section_id
    LEFT JOIN ${table('subjects')} s ON s.${escapeIdentifier(basics.subjectId)} = tsa.subject_id
    LEFT JOIN ${table('teachers')} t ON t.${escapeIdentifier(basics.teacherId)} = tsa.teacher_id
  `;
}

function scheduleSelectSql(basics) {
  const sectionName = hasColumn(basics.scheduleMeta, 'section_id')
    ? firstDisplayColumn(basics.sectionsMeta, 'sec', ['name', 'section_name', 'section', 'label'])
    : firstDisplayColumn(basics.scheduleMeta, 'cs', ['section']);
  const subjectName = hasColumn(basics.scheduleMeta, 'subject_id')
    ? firstDisplayColumn(basics.subjectsMeta, 's', ['sub_name', 'subject_name', 'name'])
    : firstDisplayColumn(basics.scheduleMeta, 'cs', ['subject']);

  return `
    SELECT
      cs.${escapeIdentifier(basics.scheduleId)} AS id,
      cs.${escapeIdentifier(basics.scheduleId)} AS schedule_id,
      ${optionalColumn(basics.scheduleMeta, 'cs', 'client_id')},
      cs.classroom_id,
      c.name AS classroom_name,
      ${optionalColumn(basics.scheduleMeta, 'cs', 'section_id')},
      ${sectionName} AS section_name,
      ${optionalColumn(basics.scheduleMeta, 'cs', 'subject_id')},
      ${subjectName} AS subject_name,
      cs.teacher_id,
      ${teacherNameExpression(basics.teachersMeta, 't')} AS teacher_name,
      cs.period_id,
      sp.period_number,
      sp.label AS period_label,
      sp.start_time,
      sp.end_time,
      sp.duration_minutes,
      ${dayExpression(basics.scheduleMeta, 'cs')} AS day_of_week,
      ${optionalColumn(basics.scheduleMeta, 'cs', 'schedule_date')},
      cs.status,
      ${optionalColumn(basics.scheduleMeta, 'cs', 'notes')},
      ${optionalColumn(basics.scheduleMeta, 'cs', 'created_at')},
      ${optionalColumn(basics.scheduleMeta, 'cs', 'updated_at')}
    FROM ${table('class_schedule')} cs
    LEFT JOIN ${table('classrooms')} c ON c.${escapeIdentifier(basics.classroomId)} = cs.classroom_id
    LEFT JOIN ${table('sections')} sec ON ${hasColumn(basics.scheduleMeta, 'section_id') ? `sec.${escapeIdentifier(basics.sectionId)} = cs.section_id` : '1 = 0'}
    LEFT JOIN ${table('subjects')} s ON ${hasColumn(basics.scheduleMeta, 'subject_id') ? `s.${escapeIdentifier(basics.subjectId)} = cs.subject_id` : '1 = 0'}
    LEFT JOIN ${table('teachers')} t ON t.${escapeIdentifier(basics.teacherId)} = cs.teacher_id
    LEFT JOIN ${table('session_periods')} sp ON sp.${escapeIdentifier(basics.periodId)} = cs.period_id
  `;
}

async function getSections(req, res) {
  const sectionsMeta = await getColumns('sections');
  const sectionId = primaryColumn(sectionsMeta, ['section_id', 'id']);
  const sectionName = firstDisplayColumn(sectionsMeta, 'sec', ['name', 'section_name', 'section', 'label']);
  const conditions = [];
  const values = [];

  if (req.query.classroom_id && hasColumn(sectionsMeta, 'classroom_id')) {
    conditions.push('sec.classroom_id = ?');
    values.push(req.query.classroom_id);
  }

  const clientId = clientIdFrom(req);
  if (clientId && hasColumn(sectionsMeta, 'client_id')) {
    conditions.push('sec.client_id = ?');
    values.push(clientId);
  }

  if (req.query.status && hasColumn(sectionsMeta, 'status')) {
    conditions.push('sec.status = ?');
    values.push(req.query.status);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await database().query(
    `
      SELECT
        sec.${escapeIdentifier(sectionId)} AS section_id,
        ${optionalColumn(sectionsMeta, 'sec', 'client_id')},
        ${optionalColumn(sectionsMeta, 'sec', 'classroom_id')},
        ${sectionName} AS name,
        ${optionalColumn(sectionsMeta, 'sec', 'status')}
      FROM ${table('sections')} sec
      ${where}
      ORDER BY name ASC
    `,
    values
  );

  return res.status(200).json({ success: true, data: rows });
}

function sectionNameColumn(sectionsMeta) {
  return firstColumn(sectionsMeta, ['name', 'section_name', 'section', 'label']);
}

function parseSectionNames(body = {}) {
  const rawValue =
    body.sectionNames !== undefined ? body.sectionNames :
      body.section_names !== undefined ? body.section_names :
        body.sections !== undefined ? body.sections :
          body.name !== undefined ? body.name :
            body.sectionName !== undefined ? body.sectionName :
              body.section_name !== undefined ? body.section_name :
                body.section;

  const rawItems = Array.isArray(rawValue) ? rawValue : String(rawValue || '').split(',');
  const seen = new Set();

  return rawItems
    .map((value) => normalizeString(value))
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function buildSectionPayload(req, sectionsMeta, name, existing = {}) {
  const body = req.body || {};
  const nameColumn = sectionNameColumn(sectionsMeta);
  const payload = {
    client_id: clientIdFrom(req) || existing.client_id,
    classroom_id: normalizePositiveInteger(getValue(body, 'classroomId', 'classroom_id', existing.classroom_id)),
    status: normalizeStatus(getValue(body, 'status', 'status', existing.status || 'Active'))
  };

  if (nameColumn) {
    payload[nameColumn] = name || normalizeString(existing[nameColumn]);
  }

  return pickPayload(sectionsMeta, payload);
}

async function validateSectionPayload(payload, sectionsMeta) {
  const nameColumn = sectionNameColumn(sectionsMeta);

  if (!nameColumn) {
    return 'Sections table must have a name, section_name, section, or label column.';
  }

  if (!payload[nameColumn]) {
    return 'Section name is required.';
  }

  if (hasColumn(sectionsMeta, 'classroom_id') && !payload.classroom_id) {
    return 'Classroom is required.';
  }

  if (payload.classroom_id) {
    const basics = await getTableBasics();
    const classroomExists = await existsById('classrooms', basics.classroomId, payload.classroom_id);
    if (!classroomExists) {
      return 'Classroom must exist.';
    }
  }

  return null;
}

async function sectionDuplicateMessage(payload, sectionsMeta, ignoreId = null) {
  const nameColumn = sectionNameColumn(sectionsMeta);
  if (!nameColumn) {
    return null;
  }

  const sectionId = primaryColumn(sectionsMeta, ['section_id', 'id']);
  const where = [`LOWER(${escapeIdentifier(nameColumn)}) = LOWER(?)`];
  const values = [payload[nameColumn]];

  if (hasColumn(sectionsMeta, 'classroom_id')) {
    where.push('classroom_id = ?');
    values.push(payload.classroom_id);
  }

  if (hasColumn(sectionsMeta, 'client_id') && payload.client_id) {
    where.push('client_id = ?');
    values.push(payload.client_id);
  }

  if (hasColumn(sectionsMeta, 'status')) {
    where.push('status = ?');
    values.push('Active');
  }

  if (ignoreId) {
    where.push(`${escapeIdentifier(sectionId)} <> ?`);
    values.push(ignoreId);
  }

  const [rows] = await database().query(
    `
      SELECT ${escapeIdentifier(sectionId)}
      FROM ${table('sections')}
      WHERE ${where.join(' AND ')}
      LIMIT 1
    `,
    values
  );

  return rows.length ? 'This class already has this section.' : null;
}

async function createSection(req, res) {
  const sectionsMeta = await getColumns('sections');
  const names = parseSectionNames(req.body);

  if (!names.length) {
    return res.status(400).json({ success: false, message: 'At least one section name is required.' });
  }

  const createdIds = [];
  const skipped = [];

  for (const name of names) {
    const payload = buildSectionPayload(req, sectionsMeta, name);
    const validationError = await validateSectionPayload(payload, sectionsMeta);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const duplicateError = await sectionDuplicateMessage(payload, sectionsMeta);
    if (duplicateError) {
      skipped.push(name);
      continue;
    }

    createdIds.push(await insertRow('sections', payload));
  }

  if (!createdIds.length && skipped.length) {
    return res.status(409).json({
      success: false,
      message: 'All selected sections already exist for this class.',
      skipped
    });
  }

  return res.status(201).json({
    success: true,
    message: skipped.length
      ? 'Sections created. Existing sections were skipped.'
      : 'Class sections created successfully.',
    ids: createdIds,
    skipped
  });
}

async function updateSection(req, res) {
  const sectionsMeta = await getColumns('sections');
  const sectionId = primaryColumn(sectionsMeta, ['section_id', 'id']);
  const id = normalizePositiveInteger(req.params.id);
  const existing = id ? await findById('sections', sectionId, id) : null;

  if (!existing) {
    return res.status(404).json({ success: false, message: 'Section not found.' });
  }

  const names = parseSectionNames(req.body);
  const payload = buildSectionPayload(req, sectionsMeta, names[0] || null, existing);
  const validationError = await validateSectionPayload(payload, sectionsMeta);
  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  const duplicateError = await sectionDuplicateMessage(payload, sectionsMeta, id);
  if (duplicateError) {
    return res.status(409).json({ success: false, message: duplicateError });
  }

  const affectedRows = await updateRow('sections', sectionId, id, payload);
  if (!affectedRows) {
    return res.status(404).json({ success: false, message: 'Section not found.' });
  }

  return res.status(200).json({ success: true, message: 'Class section updated successfully.' });
}

async function deleteSection(req, res) {
  const [sectionsMeta, assignmentMeta, scheduleMeta] = await Promise.all([
    getColumns('sections'),
    getColumns('teacher_subject_assignments'),
    getColumns('class_schedule')
  ]);
  const sectionId = primaryColumn(sectionsMeta, ['section_id', 'id']);
  const id = normalizePositiveInteger(req.params.id);

  if (!id) {
    return res.status(400).json({ success: false, message: 'Section id is required.' });
  }

  const usageQueries = [];
  const values = [];

  if (hasColumn(assignmentMeta, 'section_id')) {
    usageQueries.push(`SELECT COUNT(*) AS count FROM ${table('teacher_subject_assignments')} WHERE section_id = ?`);
    values.push(id);
  }

  if (hasColumn(scheduleMeta, 'section_id')) {
    usageQueries.push(`SELECT COUNT(*) AS count FROM ${table('class_schedule')} WHERE section_id = ?`);
    values.push(id);
  }

  if (usageQueries.length) {
    const [usageRows] = await database().query(usageQueries.join(' UNION ALL '), values);
    const isUsed = usageRows.some((row) => Number(row.count) > 0);

    if (isUsed && hasColumn(sectionsMeta, 'status')) {
      await updateRow('sections', sectionId, id, { status: 'Inactive' });
      return res.status(200).json({
        success: true,
        message: 'Section marked inactive because timetable records exist.'
      });
    }

    if (isUsed) {
      return res.status(409).json({
        success: false,
        message: 'This section is used in timetable records and cannot be deleted.'
      });
    }
  }

  const affectedRows = await deleteRow('sections', sectionId, id);
  if (!affectedRows) {
    return res.status(404).json({ success: false, message: 'Section not found.' });
  }

  return res.status(200).json({ success: true, message: 'Class section deleted successfully.' });
}

async function getSchoolSessions(req, res) {
  const sessionsMeta = await getColumns('school_sessions');
  const sessionId = primaryColumn(sessionsMeta, ['session_id', 'id']);
  const nameColumn = sessionNameColumn(sessionsMeta);
  const conditions = [];
  const values = [];

  if (!nameColumn) {
    return res.status(500).json({
      success: false,
      message: 'school_sessions table must have a name, session_name, or label column.'
    });
  }

  if (req.query.include_inactive !== 'true' && hasColumn(sessionsMeta, 'is_active')) {
    conditions.push('is_active = 1');
  }

  const clientId = clientIdFrom(req);
  if (clientId && hasColumn(sessionsMeta, 'client_id')) {
    conditions.push('client_id = ?');
    values.push(clientId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await database().query(
    `
      SELECT
        ${escapeIdentifier(sessionId)} AS session_id,
        ${escapeIdentifier(nameColumn)} AS name,
        ${hasColumn(sessionsMeta, 'sort_order') ? 'sort_order' : '1 AS sort_order'},
        ${hasColumn(sessionsMeta, 'is_active') ? 'is_active' : '1 AS is_active'}
      FROM ${table('school_sessions')}
      ${where}
      ORDER BY ${hasColumn(sessionsMeta, 'sort_order') ? 'sort_order ASC,' : ''} ${escapeIdentifier(nameColumn)} ASC
    `,
    values
  );

  return res.status(200).json({ success: true, data: rows });
}

async function createSchoolSession(req, res) {
  const sessionsMeta = await getColumns('school_sessions');
  const sessionId = primaryColumn(sessionsMeta, ['session_id', 'id']);
  const nameColumn = sessionNameColumn(sessionsMeta);
  const name = normalizeString(getValue(req.body || {}, 'name', 'name'));

  if (!nameColumn) {
    return res.status(500).json({
      success: false,
      message: 'school_sessions table must have a name, session_name, or label column.'
    });
  }

  if (!name) {
    return res.status(400).json({ success: false, message: 'Session name is required.' });
  }

  const existing = await findSessionByName(name, nameColumn);
  if (existing) {
    return res.status(200).json({
      success: true,
      message: 'Session already exists.',
      id: existing[sessionId],
      session_id: existing[sessionId]
    });
  }

  const id = await insertRow('school_sessions', pickPayload(sessionsMeta, {
    [nameColumn]: name,
    sort_order: normalizePositiveInteger(getValue(req.body || {}, 'sortOrder', 'sort_order')) || 1,
    is_active: getValue(req.body || {}, 'isActive', 'is_active', 1)
  }));

  return res.status(201).json({
    success: true,
    message: 'Session created successfully.',
    id,
    session_id: id
  });
}

function buildPeriodPayload(req, periodsMeta) {
  const body = req.body || {};
  return pickPayload(periodsMeta, {
    session_id: normalizePositiveInteger(getValue(body, 'sessionId', 'session_id')),
    period_number: normalizePositiveInteger(getValue(body, 'periodNumber', 'period_number')),
    label: normalizeString(getValue(body, 'label', 'label')),
    start_time: normalizeString(getValue(body, 'startTime', 'start_time')),
    end_time: normalizeString(getValue(body, 'endTime', 'end_time')),
    duration_minutes: normalizePositiveInteger(getValue(body, 'durationMinutes', 'duration_minutes')),
    is_active: getValue(body, 'isActive', 'is_active', 1)
  });
}

function validatePeriodPayload(payload, periodsMeta) {
  if (hasColumn(periodsMeta, 'session_id') && !payload.session_id) {
    return 'Session is required.';
  }

  if (hasColumn(periodsMeta, 'period_number') && !payload.period_number) {
    return 'Period number is required.';
  }

  if (hasColumn(periodsMeta, 'label') && !payload.label) {
    return 'Period label is required.';
  }

  if (hasColumn(periodsMeta, 'start_time') && !payload.start_time) {
    return 'Start time is required.';
  }

  if (hasColumn(periodsMeta, 'end_time') && !payload.end_time) {
    return 'End time is required.';
  }

  if (hasColumn(periodsMeta, 'duration_minutes') && !payload.duration_minutes) {
    return 'Duration is required.';
  }

  return null;
}

async function createSessionPeriod(req, res) {
  const periodsMeta = await getColumns('session_periods');
  const payload = buildPeriodPayload(req, periodsMeta);
  const validationError = validatePeriodPayload(payload, periodsMeta);

  if (validationError) {
    return res.status(400).json({ success: false, message: validationError });
  }

  if (hasColumn(periodsMeta, 'session_id')) {
    const sessionsMeta = await getColumns('school_sessions');
    const sessionId = primaryColumn(sessionsMeta, ['session_id', 'id']);
    const sessionExists = await existsById('school_sessions', sessionId, payload.session_id);

    if (!sessionExists) {
      return res.status(400).json({ success: false, message: 'Session must exist.' });
    }
  }

  const id = await insertRow('session_periods', payload);
  return res.status(201).json({
    success: true,
    message: 'Period created successfully.',
    id,
    period_id: id
  });
}

async function seedDefaultSessionPeriods(req, res) {
  const periodsMeta = await getColumns('session_periods');
  const periodId = primaryColumn(periodsMeta, ['period_id', 'id']);
  const sessionId = await ensureSession(getValue(req.body || {}, 'sessionName', 'session_name', DEFAULT_SESSION_NAME));
  const createdIds = [];
  let existingCount = 0;

  for (const period of DEFAULT_SESSION_PERIODS) {
    const [existingPeriods] = await database().query(
      `
        SELECT ${escapeIdentifier(periodId)} AS period_id
        FROM ${table('session_periods')}
        WHERE session_id = ? AND period_number = ?
        LIMIT 1
      `,
      [sessionId, period.period_number]
    );

    if (existingPeriods.length) {
      existingCount += 1;

      if (hasColumn(periodsMeta, 'is_active')) {
        await updateRow('session_periods', periodId, existingPeriods[0].period_id, { is_active: 1 });
      }

      continue;
    }

    const payload = pickPayload(periodsMeta, {
      session_id: sessionId,
      ...period,
      is_active: 1
    });
    const validationError = validatePeriodPayload(payload, periodsMeta);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    createdIds.push(await insertRow('session_periods', payload));
  }

  return res.status(createdIds.length ? 201 : 200).json({
    success: true,
    message: createdIds.length
      ? 'Default timetable periods created successfully.'
      : 'Default timetable periods are already available.',
    session_id: sessionId,
    created_count: createdIds.length,
    existing_count: existingCount,
    period_ids: createdIds
  });
}

async function getSessionPeriods(req, res) {
  const periodsMeta = await getColumns('session_periods');
  const conditions = [];
  const values = [];

  if (req.query.session_id && hasColumn(periodsMeta, 'session_id')) {
    conditions.push('session_id = ?');
    values.push(req.query.session_id);
  }

  if (req.query.include_inactive !== 'true' && hasColumn(periodsMeta, 'is_active')) {
    conditions.push('is_active = 1');
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await database().query(
    `
      SELECT *
      FROM ${table('session_periods')}
      ${where}
      ORDER BY ${hasColumn(periodsMeta, 'period_number') ? 'period_number ASC,' : ''} ${escapeIdentifier(primaryColumn(periodsMeta, ['period_id', 'id']))} ASC
    `,
    values
  );

  return res.status(200).json({ success: true, data: rows });
}

async function getTeacherSubjectAssignments(req, res) {
  const basics = await getTableBasics();
  const conditions = [];
  const values = [];

  ['classroom_id', 'section_id', 'subject_id', 'teacher_id', 'status'].forEach((field) => {
    if (req.query[field]) {
      conditions.push(`tsa.${field} = ?`);
      values.push(req.query[field]);
    }
  });

  const clientId = clientIdFrom(req);
  if (clientId && hasColumn(basics.assignmentMeta, 'client_id')) {
    conditions.push('tsa.client_id = ?');
    values.push(clientId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await database().query(
    `
      ${assignmentSelectSql(basics)}
      ${where}
      ORDER BY ${classroomOrderSql('c.name')}, section_name ASC, subject_name ASC
    `,
    values
  );

  return res.status(200).json({ success: true, data: rows });
}

async function createTeacherSubjectAssignment(req, res) {
  const basics = await getTableBasics();
  const payload = buildAssignmentPayload(req, basics);
  const referenceError = await validateAssignmentReferences(payload, basics);
  if (referenceError) {
    return res.status(400).json({ success: false, message: referenceError });
  }

  const duplicateError = await ensureSingleActiveTeacher(payload, basics);
  if (duplicateError) {
    return res.status(409).json({ success: false, message: duplicateError });
  }

  const id = await insertRow('teacher_subject_assignments', payload);
  return res.status(201).json({
    success: true,
    message: 'Teacher subject assignment saved successfully.',
    id,
    assignment_id: id
  });
}

async function updateTeacherSubjectAssignment(req, res) {
  const basics = await getTableBasics();
  const id = normalizePositiveInteger(req.params.id);
  const existing = id ? await findById('teacher_subject_assignments', basics.assignmentId, id) : null;

  if (!existing) {
    return res.status(404).json({ success: false, message: 'Teacher subject assignment not found.' });
  }

  const payload = buildAssignmentPayload(req, basics, existing);
  const hasChanges = Object.keys(req.body || {}).some((key) =>
    ['clientId', 'client_id', 'classroomId', 'classroom_id', 'sectionId', 'section_id', 'subjectId', 'subject_id', 'teacherId', 'teacher_id', 'status'].includes(key)
  );

  if (!hasChanges) {
    return res.status(400).json({ success: false, message: 'No updatable fields were provided.' });
  }

  const referenceError = await validateAssignmentReferences(payload, basics);
  if (referenceError) {
    return res.status(400).json({ success: false, message: referenceError });
  }

  const duplicateError = await ensureSingleActiveTeacher(payload, basics, id);
  if (duplicateError) {
    return res.status(409).json({ success: false, message: duplicateError });
  }

  const updatePayload = pickPayload(basics.assignmentMeta, {
    client_id: payload.client_id,
    classroom_id: payload.classroom_id,
    section_id: payload.section_id,
    subject_id: payload.subject_id,
    teacher_id: payload.teacher_id,
    status: payload.status
  });

  await updateRow('teacher_subject_assignments', basics.assignmentId, id, updatePayload);
  return res.status(200).json({ success: true, message: 'Teacher subject assignment updated successfully.' });
}

async function deleteTeacherSubjectAssignment(req, res) {
  const basics = await getTableBasics();
  const id = normalizePositiveInteger(req.params.id);
  const affectedRows = id ? await deleteRow('teacher_subject_assignments', basics.assignmentId, id) : 0;

  if (!affectedRows) {
    return res.status(404).json({ success: false, message: 'Teacher subject assignment not found.' });
  }

  return res.status(200).json({ success: true, message: 'Teacher subject assignment deleted successfully.' });
}

async function getClassSchedule(req, res) {
  const basics = await getTableBasics();
  const conditions = [];
  const values = [];

  ['classroom_id', 'section_id', 'subject_id', 'teacher_id', 'period_id', 'status'].forEach((field) => {
    if (req.query[field] && hasColumn(basics.scheduleMeta, field)) {
      conditions.push(`cs.${field} = ?`);
      values.push(req.query[field]);
    }
  });

  if (req.query.day_of_week && hasColumn(basics.scheduleMeta, 'day_of_week')) {
    conditions.push('cs.day_of_week = ?');
    values.push(normalizeDayForColumn(req.query.day_of_week, basics.scheduleMeta));
  }

  const clientId = clientIdFrom(req);
  if (clientId && hasColumn(basics.scheduleMeta, 'client_id')) {
    conditions.push('cs.client_id = ?');
    values.push(clientId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await database().query(
    `
      ${scheduleSelectSql(basics)}
      ${where}
      ORDER BY day_of_week ASC, sp.period_number ASC, ${classroomOrderSql('c.name')}, section_name ASC
    `,
    values
  );

  return res.status(200).json({ success: true, data: rows });
}

async function createClassSchedule(req, res) {
  const basics = await getTableBasics();
  const payload = await hydrateLegacyScheduleColumns(buildSchedulePayload(req, basics), basics);
  const referenceError = await validateScheduleReferences(payload, basics);
  if (referenceError) {
    return res.status(400).json({ success: false, message: referenceError });
  }

  const assignmentError = await validateTeacherSubjectAssignment(payload, basics);
  if (assignmentError) {
    return res.status(400).json({ success: false, message: assignmentError });
  }

  const classConflict = await validateClassConflict(payload, basics);
  if (classConflict) {
    return res.status(409).json({ success: false, message: classConflict });
  }

  const teacherConflict = await validateTeacherConflict(payload, basics);
  if (teacherConflict) {
    return res.status(409).json({ success: false, message: teacherConflict });
  }

  const id = await insertRow('class_schedule', pickPayload(basics.scheduleMeta, payload));
  return res.status(201).json({
    success: true,
    message: 'Class schedule saved successfully.',
    id,
    schedule_id: id
  });
}

async function updateClassSchedule(req, res) {
  const basics = await getTableBasics();
  const id = normalizePositiveInteger(req.params.id);
  const existing = id ? await findById('class_schedule', basics.scheduleId, id) : null;

  if (!existing) {
    return res.status(404).json({ success: false, message: 'Class schedule not found.' });
  }

  const payload = await hydrateLegacyScheduleColumns(buildSchedulePayload(req, basics, existing), basics);
  const hasChanges = Object.keys(req.body || {}).some((key) =>
    [
      'clientId',
      'client_id',
      'classroomId',
      'classroom_id',
      'sectionId',
      'section_id',
      'subjectId',
      'subject_id',
      'teacherId',
      'teacher_id',
      'periodId',
      'period_id',
      'dayOfWeek',
      'day_of_week',
      'scheduleDate',
      'schedule_date',
      'status',
      'notes'
    ].includes(key)
  );

  if (!hasChanges) {
    return res.status(400).json({ success: false, message: 'No updatable fields were provided.' });
  }

  const referenceError = await validateScheduleReferences(payload, basics);
  if (referenceError) {
    return res.status(400).json({ success: false, message: referenceError });
  }

  const assignmentError = await validateTeacherSubjectAssignment(payload, basics);
  if (assignmentError) {
    return res.status(400).json({ success: false, message: assignmentError });
  }

  const classConflict = await validateClassConflict(payload, basics, id);
  if (classConflict) {
    return res.status(409).json({ success: false, message: classConflict });
  }

  const teacherConflict = await validateTeacherConflict(payload, basics, id);
  if (teacherConflict) {
    return res.status(409).json({ success: false, message: teacherConflict });
  }

  const updatePayload = pickPayload(basics.scheduleMeta, payload);
  await updateRow('class_schedule', basics.scheduleId, id, updatePayload);
  return res.status(200).json({ success: true, message: 'Class schedule updated successfully.' });
}

async function deleteClassSchedule(req, res) {
  const basics = await getTableBasics();
  const id = normalizePositiveInteger(req.params.id);
  const affectedRows = id ? await deleteRow('class_schedule', basics.scheduleId, id) : 0;

  if (!affectedRows) {
    return res.status(404).json({ success: false, message: 'Class schedule not found.' });
  }

  return res.status(200).json({ success: true, message: 'Class schedule deleted successfully.' });
}

async function getClassroomSchedule(req, res) {
  req.query.status = req.query.status || 'Active';
  return getClassSchedule(req, res);
}

async function getTeacherSchedule(req, res) {
  req.query.status = req.query.status || 'Active';
  return getClassSchedule(req, res);
}

async function getDaySchedule(req, res) {
  req.query.status = req.query.status || 'Active';
  return getClassSchedule(req, res);
}

module.exports = {
  getSections: asyncHandler(getSections),
  createSection: asyncHandler(createSection),
  updateSection: asyncHandler(updateSection),
  deleteSection: asyncHandler(deleteSection),
  getSchoolSessions: asyncHandler(getSchoolSessions),
  createSchoolSession: asyncHandler(createSchoolSession),
  getSessionPeriods: asyncHandler(getSessionPeriods),
  createSessionPeriod: asyncHandler(createSessionPeriod),
  seedDefaultSessionPeriods: asyncHandler(seedDefaultSessionPeriods),
  getTeacherSubjectAssignments: asyncHandler(getTeacherSubjectAssignments),
  createTeacherSubjectAssignment: asyncHandler(createTeacherSubjectAssignment),
  updateTeacherSubjectAssignment: asyncHandler(updateTeacherSubjectAssignment),
  deleteTeacherSubjectAssignment: asyncHandler(deleteTeacherSubjectAssignment),
  getClassSchedule: asyncHandler(getClassSchedule),
  createClassSchedule: asyncHandler(createClassSchedule),
  updateClassSchedule: asyncHandler(updateClassSchedule),
  deleteClassSchedule: asyncHandler(deleteClassSchedule),
  getClassroomSchedule: asyncHandler(getClassroomSchedule),
  getTeacherSchedule: asyncHandler(getTeacherSchedule),
  getDaySchedule: asyncHandler(getDaySchedule)
};
