const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const subjectsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('subjects')}`;
const classroomsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('classrooms')}`;
const schedulesTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('class_schedule')}`;

const selectableColumns = `
  s.subject_id,
  s.client_id,
  s.classroom_id,
  c.name AS classroom_name,
  s.sub_name,
  s.marks,
  s.created_at,
  s.update_at,
  s.created_by,
  s.updated_by
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

function buildSubjectPayload(body) {
  return {
    client_id: normalizePositiveInteger(getValue(body, 'clientId', 'client_id')),
    classroom_id: normalizePositiveInteger(getValue(body, 'classroomId', 'classroom_id')),
    sub_name: normalizeString(getValue(body, 'subjectName', 'sub_name')),
    marks: normalizeString(getValue(body, 'marks')),
    created_by: normalizePositiveInteger(getValue(body, 'createdBy', 'created_by')),
    updated_by: normalizePositiveInteger(getValue(body, 'updatedBy', 'updated_by'))
  };
}

function buildSubjectUpdatePayload(body) {
  const payload = {};

  if (body.clientId !== undefined || body.client_id !== undefined) {
    payload.client_id = normalizePositiveInteger(getValue(body, 'clientId', 'client_id'));
  }

  if (body.classroomId !== undefined || body.classroom_id !== undefined) {
    payload.classroom_id = normalizePositiveInteger(getValue(body, 'classroomId', 'classroom_id'));
  }

  if (body.subjectName !== undefined || body.sub_name !== undefined) {
    payload.sub_name = normalizeString(getValue(body, 'subjectName', 'sub_name'));
  }

  if (body.marks !== undefined) {
    payload.marks = normalizeString(body.marks);
  }

  if (body.updatedBy !== undefined || body.updated_by !== undefined) {
    payload.updated_by = normalizePositiveInteger(getValue(body, 'updatedBy', 'updated_by'));
  }

  return payload;
}

function getSubjects(req, res) {
  const { client_id, classroom_id, search, teacher_id } = req.query;
  const conditions = [];
  const values = [];

  if (client_id) {
    conditions.push('s.client_id = ?');
    values.push(client_id);
  }

  if (classroom_id) {
    conditions.push('s.classroom_id = ?');
    values.push(classroom_id);
  }

  if (teacher_id) {
    conditions.push(`EXISTS (
      SELECT 1
      FROM ${schedulesTable} cs
      WHERE cs.subject_id = s.subject_id
        AND cs.classroom_id = s.classroom_id
        AND cs.teacher_id = ?
        AND (cs.status IS NULL OR cs.status = 'Active')
    )`);
    values.push(teacher_id);
  }

  if (search) {
    conditions.push('(s.sub_name LIKE ? OR s.marks LIKE ? OR c.name LIKE ?)');
    const searchValue = `%${search}%`;
    values.push(searchValue, searchValue, searchValue);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT ${selectableColumns}
    FROM ${subjectsTable} s
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = s.classroom_id
    ${whereClause}
    ORDER BY c.name ASC, s.sub_name ASC
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

function getSubjectsDropdown(req, res) {
  const { client_id } = req.query;
  const conditions = [];
  const values = [];

  if (client_id) {
    conditions.push('client_id = ?');
    values.push(client_id);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT subject_id, sub_name
    FROM ${subjectsTable}
    ${whereClause}
    ORDER BY sub_name ASC
  `;

  pool.query(sql, values, (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    return res.status(200).json(results);
  });
}

function getSubjectById(req, res) {
  const clientId = req.query.client_id;
  const sql = `
    SELECT ${selectableColumns}
    FROM ${subjectsTable} s
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = s.classroom_id
    WHERE s.subject_id = ? AND (? IS NULL OR s.client_id = ?)
  `;

  pool.query(sql, [req.params.subjectId, clientId || null, clientId || null], (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: results[0]
    });
  });
}

function createSubject(req, res) {
  const payload = buildSubjectPayload(req.body);

  if (!payload.client_id || !payload.classroom_id || !payload.sub_name) {
    return res.status(400).json({
      success: false,
      message: 'Client, class, and subject name are required'
    });
  }

  pool.query(`INSERT INTO ${subjectsTable} SET ?`, payload, (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    return res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      subject_id: result.insertId
    });
  });
}

function updateSubject(req, res) {
  const payload = buildSubjectUpdatePayload(req.body);

  if (!Object.keys(payload).length) {
    return res.status(400).json({
      success: false,
      message: 'No updatable fields were provided'
    });
  }

  if (payload.sub_name === null) {
    return res.status(400).json({
      success: false,
      message: 'Subject name is required'
    });
  }

  pool.query(`UPDATE ${subjectsTable} SET ? WHERE subject_id = ?`, [payload, req.params.subjectId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Subject updated successfully'
    });
  });
}

function deleteSubject(req, res) {
  pool.query(`DELETE FROM ${subjectsTable} WHERE subject_id = ?`, [req.params.subjectId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Subject deleted successfully'
    });
  });
}

module.exports = {
  getSubjects,
  getSubjectsDropdown,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject
};
