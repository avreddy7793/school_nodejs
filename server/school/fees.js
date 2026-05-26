const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const feesTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('fee_records')}`;
const studentsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('students')}`;
const classroomsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('classrooms')}`;

const feeColumns = [
  'monthly_fee',
  'admission_fee',
  'registration_fee',
  'art_material',
  'transport',
  'books',
  'uniform',
  'fine',
  'others',
  'previous_balance'
];

const selectableColumns = `
  fr.fee_id,
  fr.client_id,
  fr.fee_reg_no,
  fr.student_id,
  CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
  s.admission_number,
  s.yearly_fee,
  fr.classroom_id,
  c.name AS classroom_name,
  fr.fee_year,
  fr.monthly_fee,
  fr.admission_fee,
  fr.registration_fee,
  fr.art_material,
  fr.transport,
  fr.books,
  fr.uniform,
  fr.fine,
  fr.others,
  fr.previous_balance,
  fr.discount,
  fr.total,
  fr.deposit,
  fr.due_balance
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
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeMoney(value, fallback = 0) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Number(parsed.toFixed(2)) : null;
}

function normalizeText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed || null;
}

function buildFeePayload(body) {
  const payload = {
    client_id: normalizePositiveInteger(getValue(body, 'clientId', 'client_id')),
    fee_reg_no: normalizeText(getValue(body, 'feeRegNo', 'fee_reg_no')),
    student_id: normalizePositiveInteger(getValue(body, 'studentId', 'student_id')),
    classroom_id: normalizePositiveInteger(getValue(body, 'classroomId', 'classroom_id')),
    fee_year: normalizeText(getValue(body, 'feeYear', 'fee_year')),
    discount: normalizeMoney(getValue(body, 'discount'), 0),
    deposit: normalizeMoney(getValue(body, 'deposit'), 0)
  };

  feeColumns.forEach((column) => {
    const camelKey = column.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    payload[column] = normalizeMoney(getValue(body, camelKey, column), 0);
  });

  const invalidMoneyField = [...feeColumns, 'discount', 'deposit'].find((column) => payload[column] === null);
  if (invalidMoneyField) {
    payload.invalid_money_field = invalidMoneyField;
    return payload;
  }

  applyTotals(payload);
  return payload;
}

function buildFeeUpdatePayload(body) {
  const payload = {};
  const fieldMap = {
    clientId: 'client_id',
    feeRegNo: 'fee_reg_no',
    studentId: 'student_id',
    classroomId: 'classroom_id',
    feeYear: 'fee_year',
    monthlyFee: 'monthly_fee',
    admissionFee: 'admission_fee',
    registrationFee: 'registration_fee',
    artMaterial: 'art_material',
    transport: 'transport',
    books: 'books',
    uniform: 'uniform',
    fine: 'fine',
    others: 'others',
    previousBalance: 'previous_balance',
    discount: 'discount',
    deposit: 'deposit'
  };

  Object.entries(fieldMap).forEach(([camelKey, column]) => {
    if (body[camelKey] === undefined && body[column] === undefined) {
      return;
    }

    const rawValue = getValue(body, camelKey, column);

    if (['client_id', 'student_id', 'classroom_id'].includes(column)) {
      payload[column] = normalizePositiveInteger(rawValue);
      return;
    }

    if (['fee_reg_no', 'fee_year'].includes(column)) {
      payload[column] = normalizeText(rawValue);
      return;
    }

    payload[column] = normalizeMoney(rawValue, 0);
  });

  return payload;
}

function applyTotals(payload) {
  const subtotal = feeColumns.reduce((sum, column) => sum + Number(payload[column] || 0), 0);
  const total = Math.max(subtotal - Number(payload.discount || 0), 0);
  const dueBalance = Math.max(total - Number(payload.deposit || 0), 0);

  payload.total = Number(total.toFixed(2));
  payload.due_balance = Number(dueBalance.toFixed(2));
}

function getNextFeeRegNo(callback) {
  pool.query(`SELECT fee_reg_no FROM ${feesTable}`, (error, results) => {
    if (error) {
      callback(error);
      return;
    }

    const maxNumber = results.reduce((max, row) => {
      const match = String(row.fee_reg_no || '').match(/(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);

    callback(null, `FEE${String(maxNumber + 1).padStart(4, '0')}`);
  });
}

function getFeeRecords(req, res) {
  const { client_id, classroom_id, student_id, fee_year, status } = req.query;
  const conditions = [];
  const values = [];

  if (client_id) {
    conditions.push('fr.client_id = ?');
    values.push(client_id);
  }

  if (classroom_id) {
    conditions.push('fr.classroom_id = ?');
    values.push(classroom_id);
  }

  if (student_id) {
    conditions.push('fr.student_id = ?');
    values.push(student_id);
  }

  if (fee_year) {
    conditions.push('fr.fee_year = ?');
    values.push(fee_year);
  }

  if (status === 'paid') {
    conditions.push('COALESCE(fr.due_balance, 0) <= 0');
  }

  if (status === 'due') {
    conditions.push('COALESCE(fr.due_balance, 0) > 0');
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT ${selectableColumns}
    FROM ${feesTable} fr
    INNER JOIN ${studentsTable} s ON s.student_id = fr.student_id
    INNER JOIN ${classroomsTable} c ON c.classroom_id = fr.classroom_id
    ${whereClause}
    ORDER BY fr.fee_id DESC
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

function getFeeRecordById(req, res) {
  const clientId = req.query.client_id;
  const sql = `
    SELECT ${selectableColumns}
    FROM ${feesTable} fr
    INNER JOIN ${studentsTable} s ON s.student_id = fr.student_id
    INNER JOIN ${classroomsTable} c ON c.classroom_id = fr.classroom_id
    WHERE fr.fee_id = ? AND (? IS NULL OR fr.client_id = ?)
  `;

  pool.query(sql, [req.params.feeId, clientId || null, clientId || null], (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: results[0]
    });
  });
}

function createFeeRecord(req, res) {
  const payload = buildFeePayload(req.body);

  if (!payload.client_id || !payload.student_id || !payload.classroom_id || !payload.fee_year) {
    return res.status(400).json({
      success: false,
      message: 'Client, student, class, and fee year are required'
    });
  }

  if (payload.invalid_money_field) {
    return res.status(400).json({
      success: false,
      message: 'Fee amounts must be valid non-negative numbers'
    });
  }

  const insertFeeRecord = () => {
    const studentSql = `
      SELECT student_id
      FROM ${studentsTable}
      WHERE student_id = ?
        AND (? IS NULL OR client_id = ?)
        AND class_name = ?
    `;

    pool.query(studentSql, [payload.student_id, payload.client_id, payload.client_id, payload.classroom_id], (studentError, students) => {
      if (studentError) {
        return sendDatabaseError(res, studentError);
      }

      if (!students.length) {
        return res.status(400).json({
          success: false,
          message: 'Choose a valid student from the selected class'
        });
      }

      pool.query(`INSERT INTO ${feesTable} SET ?`, payload, (error, result) => {
        if (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
              success: false,
              message: 'Fee record already exists for this student and year'
            });
          }

          return sendDatabaseError(res, error);
        }

        return res.status(201).json({
          success: true,
          message: 'Fee record saved successfully',
          fee_id: result.insertId,
          fee_reg_no: payload.fee_reg_no
        });
      });
    });
  };

  if (payload.fee_reg_no) {
    insertFeeRecord();
    return;
  }

  getNextFeeRegNo((error, feeRegNo) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    payload.fee_reg_no = feeRegNo;
    insertFeeRecord();
  });
}

function updateFeeRecord(req, res) {
  const payload = buildFeeUpdatePayload(req.body);

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

  const currentSql = `SELECT * FROM ${feesTable} WHERE fee_id = ?`;
  pool.query(currentSql, [req.params.feeId], (currentError, records) => {
    if (currentError) {
      return sendDatabaseError(res, currentError);
    }

    if (!records.length) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    const mergedPayload = { ...records[0], ...payload };
    applyTotals(mergedPayload);
    payload.total = mergedPayload.total;
    payload.due_balance = mergedPayload.due_balance;

    pool.query(`UPDATE ${feesTable} SET ? WHERE fee_id = ?`, [payload, req.params.feeId], (error) => {
      if (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({
            success: false,
            message: 'Fee record already exists for this student and year'
          });
        }

        return sendDatabaseError(res, error);
      }

      return res.status(200).json({
        success: true,
        message: 'Fee record updated successfully'
      });
    });
  });
}

function deleteFeeRecord(req, res) {
  pool.query(`DELETE FROM ${feesTable} WHERE fee_id = ?`, [req.params.feeId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Fee record deleted successfully'
    });
  });
}

module.exports = {
  getFeeRecords,
  getFeeRecordById,
  createFeeRecord,
  updateFeeRecord,
  deleteFeeRecord
};
