const { pool } = require('../config');
const { classroomOrderSql } = require('./classroom-order');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || process.env.DB_DATABASE || 'school';
const classroomsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('classrooms')}`;

const selectableColumns = `
  classroom_id,
  client_id,
  name,
  capacity,
  facilities,
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

function normalizeCapacity(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
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

function buildClassroomPayload(body) {
  return {
    client_id: getValue(body, 'client_id'),
    name: normalizeString(getValue(body, 'name')),
    capacity: normalizeCapacity(getValue(body, 'capacity')),
    facilities: normalizeString(getValue(body, 'facilities'))
  };
}

function buildClassroomUpdatePayload(body) {
  const payload = {};

  if (body.name !== undefined) {
    payload.name = normalizeString(getValue(body, 'name'));
  }

  if (body.capacity !== undefined) {
    payload.capacity = normalizeCapacity(body.capacity);
  }

  if (body.facilities !== undefined) {
    payload.facilities = normalizeString(body.facilities);
  }

  if (body.client_id !== undefined) {
    payload.client_id = body.client_id;
  }

  return payload;
}

function getClassrooms(req, res) {
  const { client_id, search } = req.query;
  const conditions = [];
  const values = [];

  if (client_id) {
    conditions.push('client_id = ?');
    values.push(client_id);
  }

  if (search) {
    conditions.push('(name LIKE ? OR facilities LIKE ?)');
    const searchValue = `%${search}%`;
    values.push(searchValue, searchValue);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT ${selectableColumns} FROM ${classroomsTable} ${whereClause} ORDER BY ${classroomOrderSql('name')}, updated_at DESC`;

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

function getClassroomById(req, res) {
  const clientId = req.query.client_id;
  const sql = `SELECT ${selectableColumns} FROM ${classroomsTable} WHERE classroom_id = ? AND (? IS NULL OR client_id = ?)`;

  pool.query(sql, [req.params.classroomId, clientId || null, clientId || null], (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: results[0]
    });
  });
}

function createClassroom(req, res) {
  const payload = buildClassroomPayload(req.body);

  if (!payload.name || payload.capacity === null) {
    return res.status(400).json({
      success: false,
      message: 'Class name and capacity are required'
    });
  }

  pool.query(`INSERT INTO ${classroomsTable} SET ?`, payload, (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    return res.status(201).json({
      success: true,
      message: 'Classroom created successfully',
      classroom_id: result.insertId
    });
  });
}

function updateClassroom(req, res) {
  const payload = buildClassroomUpdatePayload(req.body);

  if (!Object.keys(payload).length) {
    return res.status(400).json({
      success: false,
      message: 'No updatable fields were provided'
    });
  }

  if (payload.capacity !== undefined && payload.capacity === null) {
    return res.status(400).json({
      success: false,
      message: 'Capacity must be a valid non-negative number'
    });
  }

  pool.query(`UPDATE ${classroomsTable} SET ? WHERE classroom_id = ?`, [payload, req.params.classroomId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Classroom updated successfully'
    });
  });
}

function deleteClassroom(req, res) {
  pool.query(`DELETE FROM ${classroomsTable} WHERE classroom_id = ?`, [req.params.classroomId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Classroom deleted successfully'
    });
  });
}

module.exports = {
  getClassrooms,
  getClassroomById,
  createClassroom,
  updateClassroom,
  deleteClassroom
};
