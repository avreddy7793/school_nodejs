const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || process.env.DB_DATABASE || 'school';
const salaryProfilesTable = table('salary_profiles');
const payrollRunsTable = table('salary_payroll_runs');
const payrollItemsTable = table('salary_payroll_items');
const salaryPaymentsTable = table('salary_payments');
const teachersTable = table('teachers');
const staffTable = table('staff');
const teacherAttendanceTable = table('teacher_attendance');
const staffAttendanceTable = table('staff_attendance');
const PAYROLL_DAYS_PER_MONTH = 30;

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

function normalizePositiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeDecimal(value, fallback = 0) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function normalizeText(value, fallback = null) {
  if (value === undefined || value === null) {
    return fallback;
  }

  const trimmed = String(value).trim();
  return trimmed || fallback;
}

function monthBounds(year, month) {
  const lastDay = new Date(year, month, 0).getDate();
  const paddedMonth = String(month).padStart(2, '0');

  return {
    start: `${year}-${paddedMonth}-01`,
    end: `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`,
    days: lastDay
  };
}

function employeeName(row) {
  return row.employee_name || `${row.employee_type} #${row.teacher_id || row.staff_id || ''}`.trim();
}

async function syncSalaryProfiles(req, res) {
  const clientId = normalizePositiveInteger(req.body.client_id ?? req.query.client_id);
  if (!clientId) {
    return res.status(400).json({ success: false, message: 'client_id is required' });
  }

  try {
    const connection = await pool.promise().getConnection();

    try {
      await connection.beginTransaction();
      const result = await syncSalaryProfilesForClient(connection, clientId);
      await connection.commit();

      return res.status(200).json({
        success: true,
        message: 'Salary profiles synced successfully',
        data: result
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

async function getSalaryProfiles(req, res) {
  const clientId = normalizePositiveInteger(req.query.client_id);
  const employeeType = normalizeText(req.query.employee_type || req.query.type);
  const values = [clientId];
  const conditions = ['sp.client_id = ?'];

  if (!clientId) {
    return res.status(400).json({ success: false, message: 'client_id is required' });
  }

  if (employeeType && ['TEACHER', 'STAFF'].includes(employeeType.toUpperCase())) {
    conditions.push('sp.employee_type = ?');
    values.push(employeeType.toUpperCase());
  }

  try {
    const [profiles] = await pool.promise().query(`
      SELECT
        sp.*,
        CASE
          WHEN sp.employee_type = 'TEACHER' THEN CONCAT_WS(' ', t.first_name, t.middle_name, t.last_name)
          ELSE CONCAT_WS(' ', s.firstName, s.lastName)
        END AS employee_name,
        CASE
          WHEN sp.employee_type = 'TEACHER' THEN t.email
          ELSE s.email
        END AS email,
        CASE
          WHEN sp.employee_type = 'TEACHER' THEN t.phone_number
          ELSE s.contactNumber
        END AS phone_number,
        CASE
          WHEN sp.employee_type = 'TEACHER' THEN t.employment_status
          ELSE s.status
        END AS employee_status
      FROM ${salaryProfilesTable} sp
      LEFT JOIN ${teachersTable} t ON sp.teacher_id = t.teacher_id
      LEFT JOIN ${staffTable} s ON sp.staff_id = s.staff_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY sp.employee_type, employee_name
    `, values);

    return res.status(200).json({ success: true, data: profiles });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function updateSalaryProfile(req, res) {
  const profileId = normalizePositiveInteger(req.params.profileId);
  const allowedFields = [
    'monthly_salary',
    'salary_mode',
    'working_days_per_month',
    'session_rate',
    'late_penalty_amount',
    'paid_leave_sessions',
    'bank_account_number',
    'ifsc_code',
    'payment_method',
    'effective_from',
    'status',
    'notes'
  ];
  const payload = {};

  if (!profileId) {
    return res.status(400).json({ success: false, message: 'Valid salary profile id is required' });
  }

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      payload[field] = req.body[field];
    }
  });

  ['monthly_salary', 'working_days_per_month', 'session_rate', 'late_penalty_amount', 'paid_leave_sessions'].forEach((field) => {
    if (payload[field] !== undefined) {
      payload[field] = normalizeDecimal(payload[field], 0);
    }
  });

  ['bank_account_number', 'ifsc_code', 'payment_method', 'effective_from', 'status', 'notes', 'salary_mode'].forEach((field) => {
    if (payload[field] !== undefined) {
      payload[field] = normalizeText(payload[field]);
    }
  });

  if (!Object.keys(payload).length) {
    return res.status(400).json({ success: false, message: 'No salary profile data supplied' });
  }

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();
    const [profiles] = await connection.query(`SELECT * FROM ${salaryProfilesTable} WHERE salary_profile_id = ?`, [profileId]);

    if (!profiles.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Salary profile not found' });
    }

    await connection.query(`UPDATE ${salaryProfilesTable} SET ? WHERE salary_profile_id = ?`, [payload, profileId]);

    if (payload.monthly_salary !== undefined) {
      const profile = profiles[0];
      if (profile.employee_type === 'TEACHER') {
        await connection.query(`UPDATE ${teachersTable} SET salary = ? WHERE teacher_id = ?`, [payload.monthly_salary, profile.teacher_id]);
      } else {
        await connection.query(`UPDATE ${staffTable} SET salary = ? WHERE staff_id = ?`, [payload.monthly_salary, profile.staff_id]);
      }
    }

    await connection.commit();
    return res.status(200).json({ success: true, message: 'Salary profile updated successfully' });
  } catch (error) {
    await connection.rollback();
    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

async function getPayrollRuns(req, res) {
  const clientId = normalizePositiveInteger(req.query.client_id);

  if (!clientId) {
    return res.status(400).json({ success: false, message: 'client_id is required' });
  }

  try {
    const [runs] = await pool.promise().query(`
      SELECT
        pr.*,
        COUNT(pi.payroll_item_id) AS employee_count,
        COALESCE(SUM(pi.net_salary), 0) AS total_net_salary,
        COALESCE(SUM(pi.paid_amount), 0) AS total_paid_amount,
        COALESCE(SUM(pi.balance_amount), 0) AS total_balance_amount
      FROM ${payrollRunsTable} pr
      LEFT JOIN ${payrollItemsTable} pi ON pr.payroll_run_id = pi.payroll_run_id
      WHERE pr.client_id = ?
      GROUP BY pr.payroll_run_id
      ORDER BY pr.payroll_year DESC, pr.payroll_month DESC
    `, [clientId]);

    return res.status(200).json({ success: true, data: runs });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function getPayrollRunById(req, res) {
  const payrollRunId = normalizePositiveInteger(req.params.payrollRunId);

  if (!payrollRunId) {
    return res.status(400).json({ success: false, message: 'Valid payroll run id is required' });
  }

  try {
    const [[run]] = await pool.promise().query(`SELECT * FROM ${payrollRunsTable} WHERE payroll_run_id = ?`, [payrollRunId]);
    if (!run) {
      return res.status(404).json({ success: false, message: 'Payroll run not found' });
    }

    const [items] = await pool.promise().query(`
      SELECT *
      FROM ${payrollItemsTable}
      WHERE payroll_run_id = ?
      ORDER BY employee_type, employee_name
    `, [payrollRunId]);

    return res.status(200).json({ success: true, data: { run, items } });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function generatePayrollRun(req, res) {
  const clientId = normalizePositiveInteger(req.body.client_id);
  const month = normalizePositiveInteger(req.body.payroll_month);
  const year = normalizePositiveInteger(req.body.payroll_year);
  const generatedBy = normalizePositiveInteger(req.body.generated_by) || null;

  if (!clientId || !month || month > 12 || !year) {
    return res.status(400).json({
      success: false,
      message: 'client_id, payroll_month, and payroll_year are required'
    });
  }

  const bounds = monthBounds(year, month);
  const periodStart = normalizeText(req.body.period_start, bounds.start);
  const periodEnd = normalizeText(req.body.period_end, bounds.end);
  const attendanceFrom = normalizeText(req.body.attendance_from, periodStart);
  const attendanceTo = normalizeText(req.body.attendance_to, periodEnd);
  const workingDays = PAYROLL_DAYS_PER_MONTH;
  const expectedSessions = PAYROLL_DAYS_PER_MONTH;
  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();
    await syncSalaryProfilesForClient(connection, clientId);

    const [existingRuns] = await connection.query(`
      SELECT *
      FROM ${payrollRunsTable}
      WHERE client_id = ? AND payroll_month = ? AND payroll_year = ?
      LIMIT 1
    `, [clientId, month, year]);
    const existingRun = existingRuns[0];

    if (existingRun && ['Approved', 'Paid'].includes(existingRun.status)) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'This payroll run is already approved or paid. Cancel it before regenerating.'
      });
    }

    let payrollRunId = existingRun?.payroll_run_id;
    const runPayload = {
      client_id: clientId,
      payroll_month: month,
      payroll_year: year,
      period_start: periodStart,
      period_end: periodEnd,
      attendance_from: attendanceFrom,
      attendance_to: attendanceTo,
      working_days: workingDays,
      expected_sessions: expectedSessions,
      status: 'Generated',
      generated_by: generatedBy,
      generated_at: new Date()
    };

    if (payrollRunId) {
      await connection.query(`DELETE FROM ${payrollItemsTable} WHERE payroll_run_id = ?`, [payrollRunId]);
      await connection.query(`UPDATE ${payrollRunsTable} SET ? WHERE payroll_run_id = ?`, [runPayload, payrollRunId]);
    } else {
      const [runResult] = await connection.query(`INSERT INTO ${payrollRunsTable} SET ?`, runPayload);
      payrollRunId = runResult.insertId;
    }

    const [profiles] = await connection.query(`
      SELECT
        sp.*,
        CASE
          WHEN sp.employee_type = 'TEACHER' THEN CONCAT_WS(' ', t.first_name, t.middle_name, t.last_name)
          ELSE CONCAT_WS(' ', s.firstName, s.lastName)
        END AS employee_name
      FROM ${salaryProfilesTable} sp
      LEFT JOIN ${teachersTable} t ON sp.teacher_id = t.teacher_id
      LEFT JOIN ${staffTable} s ON sp.staff_id = s.staff_id
      WHERE sp.client_id = ?
        AND sp.status = 'ACTIVE'
        AND (
          (sp.employee_type = 'TEACHER' AND t.employment_status = 'Active')
          OR
          (sp.employee_type = 'STAFF' AND s.status = 'ACTIVATE')
        )
      ORDER BY sp.employee_type, employee_name
    `, [clientId]);

    const attendanceMap = await loadAttendanceSummary(connection, clientId, attendanceFrom, attendanceTo);
    const itemRows = profiles.map((profile) => buildPayrollItem(profile, attendanceMap, payrollRunId, clientId, workingDays, expectedSessions));

    if (itemRows.length) {
      await connection.query(`
        INSERT INTO ${payrollItemsTable} (
          payroll_run_id,
          client_id,
          salary_profile_id,
          employee_type,
          teacher_id,
          staff_id,
          employee_name,
          base_salary,
          working_days,
          expected_sessions,
          present_sessions,
          late_sessions,
          absent_sessions,
          leave_sessions,
          paid_leave_sessions,
          payable_sessions,
          per_session_rate,
          attendance_deduction,
          late_deduction,
          manual_deduction,
          bonus_amount,
          gross_salary,
          net_salary,
          paid_amount,
          balance_amount,
          payment_status,
          notes
        ) VALUES ?
      `, [itemRows]);
    }

    await connection.commit();
    return res.status(201).json({
      success: true,
      message: 'Payroll generated successfully',
      data: {
        payroll_run_id: payrollRunId,
        employee_count: itemRows.length
      }
    });
  } catch (error) {
    await connection.rollback();
    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

async function recordSalaryPayment(req, res) {
  const payrollItemId = normalizePositiveInteger(req.params.payrollItemId);
  const amount = normalizeDecimal(req.body.amount, 0);
  const paymentDate = normalizeText(req.body.payment_date, new Date().toISOString().split('T')[0]);
  const paymentMode = normalizeText(req.body.payment_mode, 'Bank Transfer');
  const referenceNumber = normalizeText(req.body.reference_number);
  const paidBy = normalizePositiveInteger(req.body.paid_by) || null;
  const notes = normalizeText(req.body.notes);
  const connection = await pool.promise().getConnection();

  if (!payrollItemId || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Payroll item and positive payment amount are required' });
  }

  try {
    await connection.beginTransaction();
    const [[item]] = await connection.query(`SELECT * FROM ${payrollItemsTable} WHERE payroll_item_id = ?`, [payrollItemId]);

    if (!item) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Payroll item not found' });
    }

    await connection.query(`INSERT INTO ${salaryPaymentsTable} SET ?`, {
      payroll_item_id: payrollItemId,
      client_id: item.client_id,
      payment_date: paymentDate,
      amount,
      payment_mode: paymentMode,
      reference_number: referenceNumber,
      paid_by: paidBy,
      notes
    });

    const paidAmount = Number(item.paid_amount || 0) + amount;
    const balanceAmount = Math.max(Number(item.net_salary || 0) - paidAmount, 0);
    const paymentStatus = balanceAmount <= 0 ? 'Paid' : 'Partially Paid';

    await connection.query(`
      UPDATE ${payrollItemsTable}
      SET paid_amount = ?, balance_amount = ?, payment_status = ?
      WHERE payroll_item_id = ?
    `, [paidAmount, balanceAmount, paymentStatus, payrollItemId]);

    await refreshPayrollRunPaymentStatus(connection, item.payroll_run_id);
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Salary payment saved successfully',
      data: {
        paid_amount: paidAmount,
        balance_amount: balanceAmount,
        payment_status: paymentStatus
      }
    });
  } catch (error) {
    await connection.rollback();
    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

async function getSalaryPayments(req, res) {
  const payrollItemId = normalizePositiveInteger(req.params.payrollItemId);

  if (!payrollItemId) {
    return res.status(400).json({ success: false, message: 'Valid payroll item id is required' });
  }

  try {
    const [payments] = await pool.promise().query(`
      SELECT *
      FROM ${salaryPaymentsTable}
      WHERE payroll_item_id = ?
      ORDER BY payment_date DESC, salary_payment_id DESC
    `, [payrollItemId]);

    return res.status(200).json({ success: true, data: payments });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function syncSalaryProfilesForClient(connection, clientId) {
  const [teacherResult] = await connection.query(`
    INSERT INTO ${salaryProfilesTable}
      (client_id, employee_type, teacher_id, monthly_salary, bank_account_number, ifsc_code, status)
    SELECT
      client_id,
      'TEACHER',
      teacher_id,
      COALESCE(salary, 0.00),
      bank_account_number,
      ifsc_code,
      CASE WHEN employment_status = 'Active' THEN 'ACTIVE' ELSE 'INACTIVE' END
    FROM ${teachersTable}
    WHERE client_id = ?
    ON DUPLICATE KEY UPDATE
      monthly_salary = VALUES(monthly_salary),
      bank_account_number = VALUES(bank_account_number),
      ifsc_code = VALUES(ifsc_code),
      status = VALUES(status),
      updated_at = CURRENT_TIMESTAMP
  `, [clientId]);

  const [staffResult] = await connection.query(`
    INSERT INTO ${salaryProfilesTable}
      (client_id, employee_type, staff_id, monthly_salary, status)
    SELECT
      client_id,
      'STAFF',
      staff_id,
      COALESCE(salary, 0.00),
      CASE WHEN status = 'ACTIVATE' THEN 'ACTIVE' ELSE 'INACTIVE' END
    FROM ${staffTable}
    WHERE client_id = ?
    ON DUPLICATE KEY UPDATE
      monthly_salary = VALUES(monthly_salary),
      status = VALUES(status),
      updated_at = CURRENT_TIMESTAMP
  `, [clientId]);

  return {
    teacher_profiles_changed: teacherResult.affectedRows,
    staff_profiles_changed: staffResult.affectedRows
  };
}

async function loadAttendanceSummary(connection, clientId, attendanceFrom, attendanceTo) {
  const attendanceMap = new Map();
  const queries = [
    {
      type: 'TEACHER',
      sql: `
        SELECT
          teacher_id AS entity_id,
          attendance_date,
          SUM(status = 'Present') AS present_count,
          SUM(status = 'Late') AS late_count,
          SUM(status = 'Absent') AS absent_count,
          SUM(status = 'On Leave') AS leave_count
        FROM ${teacherAttendanceTable}
        WHERE client_id = ? AND attendance_date BETWEEN ? AND ?
        GROUP BY teacher_id, attendance_date
      `
    },
    {
      type: 'STAFF',
      sql: `
        SELECT
          staff_id AS entity_id,
          attendance_date,
          SUM(status = 'Present') AS present_count,
          SUM(status = 'Late') AS late_count,
          SUM(status = 'Absent') AS absent_count,
          SUM(status = 'On Leave') AS leave_count
        FROM ${staffAttendanceTable}
        WHERE client_id = ? AND attendance_date BETWEEN ? AND ?
        GROUP BY staff_id, attendance_date
      `
    }
  ];

  for (const query of queries) {
    const [rows] = await connection.query(query.sql, [clientId, attendanceFrom, attendanceTo]);
    rows.forEach((row) => {
      const key = `${query.type}:${row.entity_id}`;
      const summary = attendanceMap.get(key) || {
        present_sessions: 0,
        late_sessions: 0,
        absent_sessions: 0,
        leave_sessions: 0
      };
      const presentCount = Number(row.present_count || 0);
      const lateCount = Number(row.late_count || 0);
      const absentCount = Number(row.absent_count || 0);
      const leaveCount = Number(row.leave_count || 0);

      if (absentCount > 0) {
        summary.absent_sessions += 1;
      } else if (lateCount > 0) {
        summary.late_sessions += 1;
      } else if (presentCount > 0) {
        summary.present_sessions += 1;
      } else if (leaveCount > 0) {
        summary.leave_sessions += 1;
      }

      attendanceMap.set(key, summary);
    });
  }

  return attendanceMap;
}

function buildPayrollItem(profile, attendanceMap, payrollRunId, clientId, workingDays, expectedSessions) {
  const key = `${profile.employee_type}:${profile.teacher_id || profile.staff_id}`;
  const attendance = attendanceMap.get(key) || {
    present_sessions: 0,
    late_sessions: 0,
    absent_sessions: 0,
    leave_sessions: 0
  };
  const baseSalary = Number(profile.monthly_salary || 0);
  const paidLeaveSessions = Math.min(Number(profile.paid_leave_sessions || 0), attendance.leave_sessions);
  const presentSessions = attendance.present_sessions;
  const lateSessions = attendance.late_sessions;
  const attendedSessions = presentSessions + lateSessions;
  const payableSessions = Math.min(attendedSessions + paidLeaveSessions, expectedSessions);
  const absentSessions = Math.max(expectedSessions - payableSessions, 0);
  const perSessionRate = Number(profile.session_rate || 0) > 0
    ? Number(profile.session_rate)
    : expectedSessions > 0 ? baseSalary / expectedSessions : 0;
  const attendanceDeduction = roundMoney(absentSessions * perSessionRate);
  const lateDeduction = roundMoney(lateSessions * Number(profile.late_penalty_amount || 0));
  const grossSalary = roundMoney(baseSalary);
  const netSalary = Math.max(roundMoney(grossSalary - attendanceDeduction - lateDeduction), 0);

  return [
    payrollRunId,
    clientId,
    profile.salary_profile_id,
    profile.employee_type,
    profile.teacher_id,
    profile.staff_id,
    employeeName(profile),
    grossSalary,
    workingDays,
    expectedSessions,
    presentSessions,
    lateSessions,
    absentSessions,
    attendance.leave_sessions,
    paidLeaveSessions,
    payableSessions,
    roundMoney(perSessionRate),
    attendanceDeduction,
    lateDeduction,
    0,
    0,
    grossSalary,
    netSalary,
    0,
    netSalary,
    netSalary > 0 ? 'Pending' : 'Paid',
    null
  ];
}

function roundMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

async function refreshPayrollRunPaymentStatus(connection, payrollRunId) {
  const [[summary]] = await connection.query(`
    SELECT
      COUNT(*) AS item_count,
      SUM(payment_status = 'Paid') AS paid_count
    FROM ${payrollItemsTable}
    WHERE payroll_run_id = ?
  `, [payrollRunId]);

  if (Number(summary.item_count || 0) > 0 && Number(summary.item_count) === Number(summary.paid_count || 0)) {
    await connection.query(`UPDATE ${payrollRunsTable} SET status = 'Paid' WHERE payroll_run_id = ?`, [payrollRunId]);
  }
}

module.exports = {
  syncSalaryProfiles,
  getSalaryProfiles,
  updateSalaryProfile,
  getPayrollRuns,
  getPayrollRunById,
  generatePayrollRun,
  recordSalaryPayment,
  getSalaryPayments
};
