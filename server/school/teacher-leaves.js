const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const leavesTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('teacher_leaves')}`;
const teachersTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('teachers')}`;

const selectableColumns = `
  tl.leave_id,
  tl.client_id,
  tl.teacher_id,
  CONCAT_WS(' ', t.first_name, t.middle_name, t.last_name) AS teacher_name,
  t.department,
  t.designation,
  tl.leave_date,
  tl.leave_type,
  tl.reason,
  tl.status
`;

const statuses = new Set(['Pending', 'Approved', 'Rejected']);

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

function getValue(body, camelKey, snakeKey = camelKey, fallback = undefined) {
  if (body[camelKey] !== undefined) {
    return body[camelKey];
  }

  if (body[snakeKey] !== undefined) {
    return body[snakeKey];
  }

  return fallback;
}

function normalizePositiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed || null;
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return String(value).slice(0, 10);
}

function normalizeStatus(value) {
  const status = normalizeText(value) || 'Pending';
  return statuses.has(status) ? status : 'Pending';
}

function buildLeavePayload(body) {
  return {
    client_id: normalizePositiveInteger(getValue(body, 'clientId', 'client_id')),
    teacher_id: normalizePositiveInteger(getValue(body, 'teacherId', 'teacher_id')),
    leave_date: normalizeDate(getValue(body, 'leaveDate', 'leave_date')),
    leave_type: normalizeText(getValue(body, 'leaveType', 'leave_type')),
    reason: normalizeText(getValue(body, 'reason')),
    status: normalizeStatus(getValue(body, 'status'))
  };
}

function buildLeaveUpdatePayload(body) {
  const payload = {};
  const fieldMap = {
    clientId: 'client_id',
    teacherId: 'teacher_id',
    leaveDate: 'leave_date',
    leaveType: 'leave_type',
    reason: 'reason',
    status: 'status'
  };

  Object.entries(fieldMap).forEach(([camelKey, column]) => {
    if (body[camelKey] === undefined && body[column] === undefined) {
      return;
    }

    const rawValue = getValue(body, camelKey, column);

    if (column === 'client_id' || column === 'teacher_id') {
      payload[column] = normalizePositiveInteger(rawValue);
      return;
    }

    if (column === 'leave_date') {
      payload[column] = normalizeDate(rawValue);
      return;
    }

    if (column === 'status') {
      payload[column] = normalizeStatus(rawValue);
      return;
    }

    payload[column] = normalizeText(rawValue);
  });

  return payload;
}

function getTeacherLeaves(req, res) {
  const { client_id, teacher_id, status, leave_type, date_from, date_to, search } = req.query;
  const conditions = [];
  const values = [];

  if (client_id) {
    conditions.push('tl.client_id = ?');
    values.push(client_id);
  }

  if (teacher_id) {
    conditions.push('tl.teacher_id = ?');
    values.push(teacher_id);
  }

  if (status) {
    conditions.push('tl.status = ?');
    values.push(status);
  }

  if (leave_type) {
    conditions.push('tl.leave_type = ?');
    values.push(leave_type);
  }

  if (date_from) {
    conditions.push('tl.leave_date >= ?');
    values.push(date_from);
  }

  if (date_to) {
    conditions.push('tl.leave_date <= ?');
    values.push(date_to);
  }

  if (search) {
    conditions.push('(t.first_name LIKE ? OR t.last_name LIKE ? OR t.department LIKE ? OR tl.reason LIKE ? OR tl.leave_type LIKE ?)');
    const searchValue = `%${search}%`;
    values.push(searchValue, searchValue, searchValue, searchValue, searchValue);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT ${selectableColumns}
    FROM ${leavesTable} tl
    INNER JOIN ${teachersTable} t ON t.teacher_id = tl.teacher_id
    ${whereClause}
    ORDER BY tl.leave_date DESC, tl.leave_id DESC
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

function getTeacherLeaveById(req, res) {
  const clientId = req.query.client_id;
  const sql = `
    SELECT ${selectableColumns}
    FROM ${leavesTable} tl
    INNER JOIN ${teachersTable} t ON t.teacher_id = tl.teacher_id
    WHERE tl.leave_id = ? AND (? IS NULL OR tl.client_id = ?)
  `;

  pool.query(sql, [req.params.leaveId, clientId || null, clientId || null], (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: 'Teacher leave not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: results[0]
    });
  });
}

function createTeacherLeave(req, res) {
  const payload = buildLeavePayload(req.body);

  if (!payload.client_id || !payload.teacher_id || !payload.leave_date || !payload.leave_type || !payload.reason) {
    return res.status(400).json({
      success: false,
      message: 'Client, teacher, leave date, leave type, and reason are required'
    });
  }

  const teacherSql = `SELECT teacher_id FROM ${teachersTable} WHERE teacher_id = ? AND (? IS NULL OR client_id = ?)`;

  pool.query(teacherSql, [payload.teacher_id, payload.client_id, payload.client_id], (teacherError, teachers) => {
    if (teacherError) {
      return sendDatabaseError(res, teacherError);
    }

    if (!teachers.length) {
      return res.status(400).json({
        success: false,
        message: 'Choose a valid teacher for this client'
      });
    }

    pool.query(`INSERT INTO ${leavesTable} SET ?`, payload, (error, result) => {
      if (error) {
        return sendDatabaseError(res, error);
      }

      return res.status(201).json({
        success: true,
        message: 'Teacher leave saved successfully',
        leave_id: result.insertId
      });
    });
  });
}

function updateTeacherLeave(req, res) {
  const payload = buildLeaveUpdatePayload(req.body);

  if (!Object.keys(payload).length) {
    return res.status(400).json({
      success: false,
      message: 'No updatable fields were provided'
    });
  }

  if (Object.values(payload).some((value) => value === null)) {
    return res.status(400).json({
      success: false,
      message: 'Update values must be valid'
    });
  }

  pool.query(`UPDATE ${leavesTable} SET ? WHERE leave_id = ?`, [payload, req.params.leaveId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Teacher leave not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Teacher leave updated successfully'
    });
  });
}

function deleteTeacherLeave(req, res) {
  pool.query(`DELETE FROM ${leavesTable} WHERE leave_id = ?`, [req.params.leaveId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Teacher leave not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Teacher leave deleted successfully'
    });
  });
}

module.exports = {
  getTeacherLeaves,
  getTeacherLeaveById,
  createTeacherLeave,
  updateTeacherLeave,
  deleteTeacherLeave
};
