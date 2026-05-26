const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const roomsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('hostel_rooms')}`;
const assignmentsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('student_room_assignments')}`;
const paymentsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('hostel_payments')}`;
const studentsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('students')}`;

const roomColumns = `
  hr.room_id,
  hr.client_id,
  hr.room_number,
  hr.capacity,
  hr.current_occupancy,
  (
    SELECT COUNT(*)
    FROM ${assignmentsTable} active_sra
    WHERE active_sra.room_id = hr.room_id
      AND (active_sra.end_date IS NULL OR active_sra.end_date >= CURDATE())
  ) AS active_occupancy,
  hr.gender_specific,
  hr.fee
`;

const assignmentColumns = `
  sra.assignment_id,
  sra.client_id,
  sra.student_id,
  CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
  s.admission_number,
  s.gender AS student_gender,
  sra.room_id,
  hr.room_number,
  hr.gender_specific,
  hr.capacity,
  hr.fee,
  (
    SELECT COALESCE(SUM(hp.amount), 0)
    FROM ${paymentsTable} hp
    WHERE hp.assignment_id = sra.assignment_id
  ) AS total_paid,
  sra.start_date,
  sra.end_date
`;

const genders = new Set(['Male', 'Female', 'Unisex']);
const paymentTypes = new Set(['PARTIAL', 'FULL', 'OTHER']);
let paymentsTableReady = false;

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
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function parseMoney(value) {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  const parsed = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
}

function normalizeMoney(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? Number(parsed.toFixed(2)) : null;
}

function normalizeGender(value) {
  const normalized = normalizeText(value);
  return normalized && genders.has(normalized) ? normalized : null;
}

function normalizePaymentType(value) {
  const normalized = normalizeText(value)?.toUpperCase();
  return normalized && paymentTypes.has(normalized) ? normalized : 'PARTIAL';
}

function normalizeDate(value, allowNull = false) {
  if (!value) {
    return allowNull ? null : undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return String(value).slice(0, 10);
}

function buildRoomPayload(body) {
  return {
    client_id: normalizePositiveInteger(getValue(body, 'clientId', 'client_id')),
    room_number: normalizeText(getValue(body, 'roomNumber', 'room_number')),
    capacity: normalizePositiveInteger(getValue(body, 'capacity')),
    current_occupancy: normalizeNonNegativeInteger(getValue(body, 'currentOccupancy', 'current_occupancy', 0)),
    gender_specific: normalizeGender(getValue(body, 'genderSpecific', 'gender_specific')),
    fee: normalizeText(getValue(body, 'fee'))
  };
}

function buildRoomUpdatePayload(body) {
  const payload = {};
  const fieldMap = {
    clientId: 'client_id',
    roomNumber: 'room_number',
    capacity: 'capacity',
    currentOccupancy: 'current_occupancy',
    genderSpecific: 'gender_specific',
    fee: 'fee'
  };

  Object.entries(fieldMap).forEach(([camelKey, column]) => {
    if (body[camelKey] === undefined && body[column] === undefined) {
      return;
    }

    const rawValue = getValue(body, camelKey, column);

    if (column === 'client_id' || column === 'capacity') {
      payload[column] = normalizePositiveInteger(rawValue);
      return;
    }

    if (column === 'current_occupancy') {
      payload[column] = normalizeNonNegativeInteger(rawValue);
      return;
    }

    if (column === 'gender_specific') {
      payload[column] = normalizeGender(rawValue);
      return;
    }

    payload[column] = normalizeText(rawValue);
  });

  return payload;
}

function buildAssignmentPayload(body) {
  return {
    client_id: normalizePositiveInteger(getValue(body, 'clientId', 'client_id')),
    student_id: normalizePositiveInteger(getValue(body, 'studentId', 'student_id')),
    room_id: normalizePositiveInteger(getValue(body, 'roomId', 'room_id')),
    start_date: normalizeDate(getValue(body, 'startDate', 'start_date')),
    end_date: normalizeDate(getValue(body, 'endDate', 'end_date'), true)
  };
}

function buildAssignmentUpdatePayload(body) {
  const payload = {};
  const fieldMap = {
    clientId: 'client_id',
    studentId: 'student_id',
    roomId: 'room_id',
    startDate: 'start_date',
    endDate: 'end_date'
  };

  Object.entries(fieldMap).forEach(([camelKey, column]) => {
    if (body[camelKey] === undefined && body[column] === undefined) {
      return;
    }

    const rawValue = getValue(body, camelKey, column);

    if (column === 'client_id' || column === 'student_id' || column === 'room_id') {
      payload[column] = normalizePositiveInteger(rawValue);
      return;
    }

    payload[column] = normalizeDate(rawValue, column === 'end_date');
  });

  return payload;
}

function buildPaymentPayload(body) {
  return {
    client_id: normalizePositiveInteger(getValue(body, 'clientId', 'client_id')),
    assignment_id: normalizePositiveInteger(getValue(body, 'assignmentId', 'assignment_id')),
    payment_date: normalizeDate(getValue(body, 'paymentDate', 'payment_date')) || new Date().toISOString().slice(0, 10),
    payment_type: normalizePaymentType(getValue(body, 'paymentType', 'payment_type')),
    payment_mode: normalizeText(getValue(body, 'paymentMode', 'payment_mode', 'Cash')) || 'Cash',
    amount: normalizeMoney(getValue(body, 'amount')),
    notes: normalizeText(getValue(body, 'notes'))
  };
}

function activeAssignmentCondition(alias = 'sra') {
  return `(${alias}.end_date IS NULL OR ${alias}.end_date >= CURDATE())`;
}

function ensurePaymentsTable(callback) {
  if (paymentsTableReady) {
    callback();
    return;
  }

  const sql = `
    CREATE TABLE IF NOT EXISTS ${paymentsTable} (
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
  `;

  pool.query(sql, (error) => {
    if (!error) {
      paymentsTableReady = true;
    }

    callback(error);
  });
}

function buildReceiptNumber() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0')
  ].join('');
  const suffix = String(Math.floor(Math.random() * 1000)).padStart(3, '0');

  return `HST${stamp}${suffix}`;
}

function getPaymentStatus(totalFee, totalPaid) {
  if (totalFee <= 0) {
    return totalPaid > 0 ? 'Fully Paid' : 'Unpaid';
  }

  if (totalPaid >= totalFee) {
    return 'Fully Paid';
  }

  return totalPaid > 0 ? 'Partial' : 'Unpaid';
}

function recalculateRoomOccupancy(roomId, callback) {
  const countSql = `SELECT COUNT(*) AS active_count FROM ${assignmentsTable} sra WHERE sra.room_id = ? AND ${activeAssignmentCondition('sra')}`;

  pool.query(countSql, [roomId], (countError, rows) => {
    if (countError) {
      callback(countError);
      return;
    }

    const activeCount = rows[0]?.active_count || 0;
    pool.query(`UPDATE ${roomsTable} SET current_occupancy = ? WHERE room_id = ?`, [activeCount, roomId], callback);
  });
}

function getRooms(req, res) {
  const { client_id, gender_specific, available, search } = req.query;
  const conditions = [];
  const values = [];

  if (client_id) {
    conditions.push('hr.client_id = ?');
    values.push(client_id);
  }

  if (gender_specific) {
    conditions.push('hr.gender_specific = ?');
    values.push(gender_specific);
  }

  if (search) {
    conditions.push('(hr.room_number LIKE ? OR hr.fee LIKE ?)');
    const searchValue = `%${search}%`;
    values.push(searchValue, searchValue);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const havingClause = available === 'true' ? 'HAVING active_occupancy < hr.capacity' : '';
  const sql = `
    SELECT ${roomColumns}
    FROM ${roomsTable} hr
    ${whereClause}
    ${havingClause}
    ORDER BY hr.room_number ASC
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

function getRoomById(req, res) {
  const clientId = req.query.client_id;
  const sql = `
    SELECT ${roomColumns}
    FROM ${roomsTable} hr
    WHERE hr.room_id = ? AND (? IS NULL OR hr.client_id = ?)
  `;

  pool.query(sql, [req.params.roomId, clientId || null, clientId || null], (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: 'Hostel room not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: results[0]
    });
  });
}

function createRoom(req, res) {
  const payload = buildRoomPayload(req.body);

  if (!payload.client_id || !payload.room_number || !payload.capacity || !payload.gender_specific) {
    return res.status(400).json({
      success: false,
      message: 'Client, room number, capacity, and gender are required'
    });
  }

  if (payload.current_occupancy > payload.capacity) {
    return res.status(400).json({
      success: false,
      message: 'Current occupancy cannot be greater than capacity'
    });
  }

  pool.query(`INSERT INTO ${roomsTable} SET ?`, payload, (error, result) => {
    if (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'Room number already exists'
        });
      }

      return sendDatabaseError(res, error);
    }

    return res.status(201).json({
      success: true,
      message: 'Hostel room saved successfully',
      room_id: result.insertId
    });
  });
}

function updateRoom(req, res) {
  const payload = buildRoomUpdatePayload(req.body);

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

  pool.query(`UPDATE ${roomsTable} SET ? WHERE room_id = ?`, [payload, req.params.roomId], (error, result) => {
    if (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'Room number already exists'
        });
      }

      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Hostel room not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Hostel room updated successfully'
    });
  });
}

function deleteRoom(req, res) {
  pool.query(`DELETE FROM ${roomsTable} WHERE room_id = ?`, [req.params.roomId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Hostel room not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Hostel room deleted successfully'
    });
  });
}

function getAssignments(req, res) {
  ensurePaymentsTable((tableError) => {
    if (tableError) {
      return sendDatabaseError(res, tableError);
    }

    const { client_id, room_id, student_id, active, search } = req.query;
    const conditions = [];
    const values = [];

    if (client_id) {
      conditions.push('sra.client_id = ?');
      values.push(client_id);
    }

    if (room_id) {
      conditions.push('sra.room_id = ?');
      values.push(room_id);
    }

    if (student_id) {
      conditions.push('sra.student_id = ?');
      values.push(student_id);
    }

    if (active === 'true') {
      conditions.push(activeAssignmentCondition('sra'));
    }

    if (search) {
      conditions.push('(s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ? OR hr.room_number LIKE ?)');
      const searchValue = `%${search}%`;
      values.push(searchValue, searchValue, searchValue, searchValue);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT ${assignmentColumns}
      FROM ${assignmentsTable} sra
      INNER JOIN ${studentsTable} s ON s.student_id = sra.student_id
      INNER JOIN ${roomsTable} hr ON hr.room_id = sra.room_id
      ${whereClause}
      ORDER BY sra.start_date DESC, sra.assignment_id DESC
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
  });
}

function getPayments(req, res) {
  ensurePaymentsTable((tableError) => {
    if (tableError) {
      return sendDatabaseError(res, tableError);
    }

    const { client_id, assignment_id, room_id, student_id } = req.query;
    const conditions = [];
    const values = [];

    if (client_id) {
      conditions.push('hp.client_id = ?');
      values.push(client_id);
    }

    if (assignment_id) {
      conditions.push('hp.assignment_id = ?');
      values.push(assignment_id);
    }

    if (room_id) {
      conditions.push('hp.room_id = ?');
      values.push(room_id);
    }

    if (student_id) {
      conditions.push('hp.student_id = ?');
      values.push(student_id);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT
        hp.payment_id,
        hp.client_id,
        hp.assignment_id,
        hp.student_id,
        CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
        s.admission_number,
        hp.room_id,
        hr.room_number,
        hr.fee,
        hp.receipt_no,
        hp.payment_date,
        hp.payment_type,
        hp.payment_mode,
        hp.amount,
        hp.notes,
        hp.created_at
      FROM ${paymentsTable} hp
      INNER JOIN ${studentsTable} s ON s.student_id = hp.student_id
      INNER JOIN ${roomsTable} hr ON hr.room_id = hp.room_id
      ${whereClause}
      ORDER BY hp.payment_date DESC, hp.payment_id DESC
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
  });
}

function createPayment(req, res) {
  ensurePaymentsTable((tableError) => {
    if (tableError) {
      return sendDatabaseError(res, tableError);
    }

    const payload = buildPaymentPayload(req.body);

    if (!payload.client_id || !payload.assignment_id || !payload.payment_date || !payload.amount) {
      return res.status(400).json({
        success: false,
        message: 'Client, assignment, payment date, and amount are required'
      });
    }

    const detailSql = `
      SELECT
        sra.assignment_id,
        sra.client_id,
        sra.student_id,
        sra.room_id,
        hr.room_number,
        hr.fee,
        COALESCE(SUM(hp.amount), 0) AS total_paid
      FROM ${assignmentsTable} sra
      INNER JOIN ${roomsTable} hr ON hr.room_id = sra.room_id
      LEFT JOIN ${paymentsTable} hp ON hp.assignment_id = sra.assignment_id
      WHERE sra.assignment_id = ?
        AND sra.client_id = ?
      GROUP BY sra.assignment_id, sra.client_id, sra.student_id, sra.room_id, hr.room_number, hr.fee
    `;

    pool.query(detailSql, [payload.assignment_id, payload.client_id], (detailError, rows) => {
      if (detailError) {
        return sendDatabaseError(res, detailError);
      }

      if (!rows.length) {
        return res.status(404).json({
          success: false,
          message: 'Room assignment not found'
        });
      }

      const assignment = rows[0];
      const totalFee = parseMoney(assignment.fee);
      const alreadyPaid = parseMoney(assignment.total_paid);
      const dueBeforePayment = Math.max(totalFee - alreadyPaid, 0);

      if (totalFee <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Set a hostel fee for this room before collecting payment'
        });
      }

      if (payload.amount > dueBeforePayment) {
        return res.status(400).json({
          success: false,
          message: 'Payment amount cannot be greater than the due balance'
        });
      }

      const totalPaid = Number((alreadyPaid + payload.amount).toFixed(2));
      const dueAfterPayment = Number(Math.max(totalFee - totalPaid, 0).toFixed(2));
      const insertPayload = {
        client_id: payload.client_id,
        assignment_id: payload.assignment_id,
        student_id: assignment.student_id,
        room_id: assignment.room_id,
        receipt_no: buildReceiptNumber(),
        payment_date: payload.payment_date,
        payment_type: dueAfterPayment <= 0 ? 'FULL' : payload.payment_type,
        payment_mode: payload.payment_mode,
        amount: payload.amount,
        notes: payload.notes
      };

      pool.query(`INSERT INTO ${paymentsTable} SET ?`, insertPayload, (error, result) => {
        if (error) {
          return sendDatabaseError(res, error);
        }

        return res.status(201).json({
          success: true,
          message: 'Hostel payment saved successfully',
          payment_id: result.insertId,
          receipt_no: insertPayload.receipt_no,
          data: {
            ...insertPayload,
            payment_id: result.insertId,
            total_fee: totalFee,
            total_paid: totalPaid,
            due_amount: dueAfterPayment,
            payment_status: getPaymentStatus(totalFee, totalPaid)
          }
        });
      });
    });
  });
}

function createAssignment(req, res) {
  const payload = buildAssignmentPayload(req.body);

  if (!payload.client_id || !payload.student_id || !payload.room_id || !payload.start_date) {
    return res.status(400).json({
      success: false,
      message: 'Client, student, room, and start date are required'
    });
  }

  const detailSql = `
    SELECT
      hr.room_id,
      hr.capacity,
      hr.gender_specific,
      s.student_id,
      s.gender,
      (
        SELECT COUNT(*)
        FROM ${assignmentsTable} active_sra
        WHERE active_sra.room_id = hr.room_id
          AND ${activeAssignmentCondition('active_sra')}
      ) AS active_occupancy,
      (
        SELECT COUNT(*)
        FROM ${assignmentsTable} student_sra
        WHERE student_sra.student_id = s.student_id
          AND ${activeAssignmentCondition('student_sra')}
      ) AS active_student_assignments
    FROM ${roomsTable} hr
    INNER JOIN ${studentsTable} s ON s.student_id = ?
    WHERE hr.room_id = ?
      AND hr.client_id = ?
      AND s.client_id = ?
  `;

  pool.query(detailSql, [payload.student_id, payload.room_id, payload.client_id, payload.client_id], (detailError, rows) => {
    if (detailError) {
      return sendDatabaseError(res, detailError);
    }

    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: 'Choose a valid student and room for this client'
      });
    }

    const details = rows[0];

    if (details.active_student_assignments > 0) {
      return res.status(409).json({
        success: false,
        message: 'Student already has an active room assignment'
      });
    }

    if (details.active_occupancy >= details.capacity) {
      return res.status(409).json({
        success: false,
        message: 'Selected room is already full'
      });
    }

    if (details.gender_specific !== 'Unisex' && details.gender && details.gender_specific !== details.gender) {
      return res.status(400).json({
        success: false,
        message: 'Student gender does not match the selected room'
      });
    }

    pool.query(`INSERT INTO ${assignmentsTable} SET ?`, payload, (error, result) => {
      if (error) {
        return sendDatabaseError(res, error);
      }

      recalculateRoomOccupancy(payload.room_id, (occupancyError) => {
        if (occupancyError) {
          return sendDatabaseError(res, occupancyError);
        }

        return res.status(201).json({
          success: true,
          message: 'Student assigned to room successfully',
          assignment_id: result.insertId
        });
      });
    });
  });
}

function updateAssignment(req, res) {
  const payload = buildAssignmentUpdatePayload(req.body);

  if (!Object.keys(payload).length) {
    return res.status(400).json({
      success: false,
      message: 'No updatable fields were provided'
    });
  }

  const invalidValue = Object.entries(payload).some(([key, value]) => key !== 'end_date' && value === null);
  if (invalidValue) {
    return res.status(400).json({
      success: false,
      message: 'Update values must be valid'
    });
  }

  pool.query(`SELECT room_id FROM ${assignmentsTable} WHERE assignment_id = ?`, [req.params.assignmentId], (currentError, rows) => {
    if (currentError) {
      return sendDatabaseError(res, currentError);
    }

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Room assignment not found'
      });
    }

    const oldRoomId = rows[0].room_id;
    pool.query(`UPDATE ${assignmentsTable} SET ? WHERE assignment_id = ?`, [payload, req.params.assignmentId], (error) => {
      if (error) {
        return sendDatabaseError(res, error);
      }

      const newRoomId = payload.room_id || oldRoomId;
      recalculateRoomOccupancy(oldRoomId, (oldRoomError) => {
        if (oldRoomError) {
          return sendDatabaseError(res, oldRoomError);
        }

        if (newRoomId === oldRoomId) {
          return res.status(200).json({
            success: true,
            message: 'Room assignment updated successfully'
          });
        }

        recalculateRoomOccupancy(newRoomId, (newRoomError) => {
          if (newRoomError) {
            return sendDatabaseError(res, newRoomError);
          }

          return res.status(200).json({
            success: true,
            message: 'Room assignment updated successfully'
          });
        });
      });
    });
  });
}

function deleteAssignment(req, res) {
  pool.query(`SELECT room_id FROM ${assignmentsTable} WHERE assignment_id = ?`, [req.params.assignmentId], (currentError, rows) => {
    if (currentError) {
      return sendDatabaseError(res, currentError);
    }

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Room assignment not found'
      });
    }

    const roomId = rows[0].room_id;
    pool.query(`DELETE FROM ${assignmentsTable} WHERE assignment_id = ?`, [req.params.assignmentId], (error) => {
      if (error) {
        return sendDatabaseError(res, error);
      }

      recalculateRoomOccupancy(roomId, (occupancyError) => {
        if (occupancyError) {
          return sendDatabaseError(res, occupancyError);
        }

        return res.status(200).json({
          success: true,
          message: 'Room assignment deleted successfully'
        });
      });
    });
  });
}

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getPayments,
  createPayment
};
