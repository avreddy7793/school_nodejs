const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const classroomSessionsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('classroom_sessions')}`;

const selectableColumns = `
  session_id,
  client_id,
  classroom_id,
  teacher_id,
  subject,
  grade,
  section,
  schedule,
  status,
  created_at,
  updated_at
`;

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

function getValue(body, key, fallback = undefined) {
  if (body[key] !== undefined) {
    return body[key];
  }

  return fallback;
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

function buildSessionPayload(body) {
  return {
    client_id: getValue(body, 'clientId'),
    classroom_id: getValue(body, 'classroomId'),
    teacher_id: getValue(body, 'teacherId'),
    subject: normalizeString(getValue(body, 'subject')),
    grade: normalizeString(getValue(body, 'grade')),
    section: normalizeString(getValue(body, 'section')),
    schedule: normalizeString(getValue(body, 'schedule')),
    status: normalizeString(getValue(body, 'status')) || 'Active'
  };
}

function buildSessionUpdatePayload(body) {
  const payload = {};

  if (body.clientId !== undefined) {
    payload.client_id = body.clientId;
  }

  if (body.classroomId !== undefined) {
    payload.classroom_id = body.classroomId;
  }

  if (body.teacherId !== undefined) {
    payload.teacher_id = body.teacherId;
  }

  if (body.subject !== undefined) {
    payload.subject = normalizeString(body.subject);
  }

  if (body.grade !== undefined) {
    payload.grade = normalizeString(body.grade);
  }

  if (body.section !== undefined) {
    payload.section = normalizeString(body.section);
  }

  if (body.schedule !== undefined) {
    payload.schedule = normalizeString(body.schedule);
  }

  if (body.status !== undefined) {
    payload.status = normalizeString(body.status) || 'Active';
  }

  return payload;
}

function getClassroomSessions(req, res) {
  const { client_id, classroom_id, teacher_id, status } = req.query;
  const conditions = [];
  const values = [];

  if (client_id) {
    conditions.push('client_id = ?');
    values.push(client_id);
  }

  if (classroom_id) {
    conditions.push('classroom_id = ?');
    values.push(classroom_id);
  }

  if (teacher_id) {
    conditions.push('teacher_id = ?');
    values.push(teacher_id);
  }

  if (status) {
    conditions.push('status = ?');
    values.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT ${selectableColumns} FROM ${classroomSessionsTable} ${whereClause} ORDER BY updated_at DESC`;

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

function getClassroomSessionById(req, res) {
  const clientId = req.query.client_id;
  const sql = `SELECT ${selectableColumns} FROM ${classroomSessionsTable} WHERE session_id = ? AND (? IS NULL OR client_id = ?)`;

  pool.query(sql, [req.params.sessionId, clientId || null, clientId || null], (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: 'Classroom session not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: results[0]
    });
  });
}

function createClassroomSession(req, res) {
  const payload = buildSessionPayload(req.body);

  if (!payload.classroom_id || !payload.teacher_id) {
    return res.status(400).json({
      success: false,
      message: 'Classroom id and teacher id are required'
    });
  }

  pool.query(`INSERT INTO ${classroomSessionsTable} SET ?`, payload, (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    return res.status(201).json({
      success: true,
      message: 'Classroom session created successfully',
      session_id: result.insertId
    });
  });
}

function updateClassroomSession(req, res) {
  const payload = buildSessionUpdatePayload(req.body);

  if (!Object.keys(payload).length) {
    return res.status(400).json({
      success: false,
      message: 'No updatable fields were provided'
    });
  }

  pool.query(`UPDATE ${classroomSessionsTable} SET ? WHERE session_id = ?`, [payload, req.params.sessionId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Classroom session not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Classroom session updated successfully'
    });
  });
}

function deleteClassroomSession(req, res) {
  pool.query(`DELETE FROM ${classroomSessionsTable} WHERE session_id = ?`, [req.params.sessionId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Classroom session not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Classroom session deleted successfully'
    });
  });
}

module.exports = {
  getClassroomSessions,
  getClassroomSessionById,
  createClassroomSession,
  updateClassroomSession,
  deleteClassroomSession
};
