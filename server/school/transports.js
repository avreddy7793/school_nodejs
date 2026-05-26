const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const transportsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('transports')}`;
const staffTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('staff')}`;

const selectableColumns = `
  t.transport_id,
  t.client_id,
  t.vehicleNumber,
  t.driverName,
  CONCAT_WS(' ', s.firstName, s.lastName) AS driver_name,
  s.employee_id AS driver_employee_id,
  t.route,
  t.capacity,
  t.departureTime,
  t.status
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

function normalizeText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed || null;
}

function normalizePositiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeNonNegativeInteger(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function normalizeStatus(value) {
  const normalized = String(value || 'Active').trim().toLowerCase();
  return normalized === 'inactive' ? 'Inactive' : 'Active';
}

function buildTransportPayload(body) {
  return {
    client_id: normalizePositiveInteger(getValue(body, 'clientId', 'client_id')),
    vehicleNumber: normalizeText(getValue(body, 'vehicleNumber', 'vehicle_number')),
    driverName: normalizePositiveInteger(getValue(body, 'driverName', 'driver_name')),
    route: normalizeText(getValue(body, 'route')),
    capacity: normalizeNonNegativeInteger(getValue(body, 'capacity')),
    departureTime: normalizeText(getValue(body, 'departureTime', 'departure_time')),
    status: normalizeStatus(getValue(body, 'status'))
  };
}

function buildTransportUpdatePayload(body) {
  const payload = {};
  const fieldMap = {
    clientId: 'client_id',
    vehicleNumber: 'vehicleNumber',
    driverName: 'driverName',
    route: 'route',
    capacity: 'capacity',
    departureTime: 'departureTime',
    status: 'status'
  };

  Object.entries(fieldMap).forEach(([camelKey, column]) => {
    if (body[camelKey] === undefined && body[column] === undefined) {
      return;
    }

    const rawValue = getValue(body, camelKey, column);

    if (column === 'client_id' || column === 'driverName') {
      payload[column] = normalizePositiveInteger(rawValue);
      return;
    }

    if (column === 'capacity') {
      payload[column] = normalizeNonNegativeInteger(rawValue);
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

function getTransports(req, res) {
  const { client_id, driver_id, status, search } = req.query;
  const conditions = [];
  const values = [];

  if (client_id) {
    conditions.push('t.client_id = ?');
    values.push(client_id);
  }

  if (driver_id) {
    conditions.push('t.driverName = ?');
    values.push(driver_id);
  }

  if (status) {
    conditions.push('t.status = ?');
    values.push(normalizeStatus(status));
  }

  if (search) {
    conditions.push('(t.vehicleNumber LIKE ? OR t.route LIKE ? OR s.firstName LIKE ? OR s.lastName LIKE ? OR s.employee_id LIKE ?)');
    const searchValue = `%${search}%`;
    values.push(searchValue, searchValue, searchValue, searchValue, searchValue);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT ${selectableColumns}
    FROM ${transportsTable} t
    LEFT JOIN ${staffTable} s ON s.staff_id = t.driverName
    ${whereClause}
    ORDER BY t.transport_id DESC
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

function getTransportById(req, res) {
  const clientId = req.query.client_id;
  const sql = `
    SELECT ${selectableColumns}
    FROM ${transportsTable} t
    LEFT JOIN ${staffTable} s ON s.staff_id = t.driverName
    WHERE t.transport_id = ? AND (? IS NULL OR t.client_id = ?)
  `;

  pool.query(sql, [req.params.transportId, clientId || null, clientId || null], (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: 'Transport not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: results[0]
    });
  });
}

function createTransport(req, res) {
  const payload = buildTransportPayload(req.body);

  if (!payload.client_id || !payload.vehicleNumber) {
    return res.status(400).json({
      success: false,
      message: 'Client and vehicle number are required'
    });
  }

  pool.query(`INSERT INTO ${transportsTable} SET ?`, payload, (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    return res.status(201).json({
      success: true,
      message: 'Transport saved successfully',
      transport_id: result.insertId
    });
  });
}

function updateTransport(req, res) {
  const payload = buildTransportUpdatePayload(req.body);

  if (!Object.keys(payload).length) {
    return res.status(400).json({
      success: false,
      message: 'No updatable fields were provided'
    });
  }

  if (payload.client_id === null || payload.vehicleNumber === null || payload.capacity === null) {
    return res.status(400).json({
      success: false,
      message: 'Update values must be valid'
    });
  }

  pool.query(`UPDATE ${transportsTable} SET ? WHERE transport_id = ?`, [payload, req.params.transportId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Transport not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transport updated successfully'
    });
  });
}

function deleteTransport(req, res) {
  pool.query(`DELETE FROM ${transportsTable} WHERE transport_id = ?`, [req.params.transportId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Transport not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transport deleted successfully'
    });
  });
}

module.exports = {
  getTransports,
  getTransportById,
  createTransport,
  updateTransport,
  deleteTransport
};
