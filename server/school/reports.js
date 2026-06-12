const { pool } = require('../config');
const { classroomOrderSql } = require('./classroom-order');
const whatsapp = require('./whatsapp');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || process.env.DB_DATABASE || 'school';
const db = pool.promise();

const studentsTable = table('students');
const classroomsTable = table('classrooms');
const examsTable = table('exams');
const examResultsTable = table('exam_results');
const subjectsTable = table('subjects');
const studentAttendanceTable = table('student_attendance');
const clientMasterTable = table('client_master');
const feeRecordsTable = table('fee_records');
const feePaymentsTable = table('fee_payments');
const hostelAssignmentsTable = table('student_room_assignments');
const hostelRoomsTable = table('hostel_rooms');
const hostelPaymentsTable = table('hostel_payments');
const transportsTable = table('transports');

function table(name) {
  return `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier(name)}`;
}

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

function normalizePositiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
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

function feeCategoryExpression(category) {
  const normalized = String(category || 'ALL').trim().toUpperCase();
  const expressions = {
    SCHOOL: 'COALESCE(fr.monthly_fee, 0) + COALESCE(fr.registration_fee, 0) + COALESCE(fr.art_material, 0) + COALESCE(fr.books, 0) + COALESCE(fr.uniform, 0) + COALESCE(fr.fine, 0) + COALESCE(fr.others, 0) + COALESCE(fr.previous_balance, 0)',
    ADMISSION: 'COALESCE(fr.admission_fee, 0)',
    TRANSPORT: 'COALESCE(fr.transport, 0)',
    ALL: 'COALESCE(fr.total, 0)'
  };

  return expressions[normalized] || expressions.ALL;
}

function currentAcademicYear(today = new Date()) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const startYear = month >= 5 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

function percent(numerator, denominator) {
  const top = Number(numerator || 0);
  const bottom = Number(denominator || 0);
  return bottom > 0 ? Math.round((top / bottom) * 100) : 0;
}

function gradeForPercentage(value) {
  if (value >= 90) return 'A+';
  if (value >= 80) return 'A';
  if (value >= 70) return 'B+';
  if (value >= 60) return 'B';
  if (value >= 50) return 'C';
  if (value >= 40) return 'D';
  return 'E';
}

function remarksForCard(card) {
  if (!card.results.length) {
    return 'Results are pending for this academic year.';
  }

  if (card.pass_rate >= 90 && card.attendance_rate >= 90) {
    return 'Excellent academic performance and attendance.';
  }

  if (card.pass_rate >= 70) {
    return 'Good progress. Continue regular practice and revision.';
  }

  if (card.attendance_rate < 75) {
    return 'Attendance needs attention along with focused academic support.';
  }

  return 'Needs focused support and regular follow-up.';
}

function parentPhone(student) {
  return normalizeText(student.guardian_contact || student.father_contact || student.mother_contact || student.phone_number, '');
}

function progressMessage(student, schoolName, summary) {
  return [
    `Dear parent, ${student.student_name}'s progress card is ready.`,
    `Class: ${student.classroom_name || '-'}${student.section ? ` - ${student.section}` : ''}`,
    `Academic year: ${summary.academic_year}`,
    `Marks: ${summary.obtained}/${summary.total_marks} (${summary.percentage}%, Grade ${summary.grade})`,
    `Attendance: ${summary.attendance_percentage}%`,
    `Result summary: ${summary.passed} pass, ${summary.failed} fail, ${summary.absent} absent.`,
    `Remarks: ${summary.remarks}`,
    `- ${schoolName}`
  ].join('\n');
}

async function getProgressCards(req, res) {
  try {
    const clientId = normalizePositiveInteger(req.query.client_id || req.decoded?.client_id);
    const classroomId = normalizePositiveInteger(req.query.classroom_id || req.query.class_id);
    const studentId = normalizePositiveInteger(req.query.student_id);
    const academicYear = normalizeText(req.query.academic_year, currentAcademicYear());
    const dateFrom = normalizeDate(req.query.date_from);
    const dateTo = normalizeDate(req.query.date_to);

    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Client id is required' });
    }

    const studentConditions = ['s.client_id = ?'];
    const studentValues = [clientId];

    if (classroomId) {
      studentConditions.push('s.class_name = ?');
      studentValues.push(classroomId);
    }

    if (studentId) {
      studentConditions.push('s.student_id = ?');
      studentValues.push(studentId);
    }

    if (academicYear) {
      studentConditions.push('(s.academic_year = ? OR s.academic_year IS NULL OR s.academic_year = \'\')');
      studentValues.push(academicYear);
    }

    const [schoolRows] = await db.query(`
      SELECT client_name, client_address, mobile_number, email, img
      FROM ${clientMasterTable}
      WHERE client_id = ?
      LIMIT 1
    `, [clientId]);

    const [students] = await db.query(`
      SELECT
        s.student_id,
        s.client_id,
        s.admission_number,
        CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
        s.roll_number,
        s.class_name AS classroom_id,
        c.name AS classroom_name,
        s.section,
        s.academic_year,
        s.father_name,
        s.mother_name,
        s.guardian_name,
        s.total_days_present,
        s.total_days_absent
      FROM ${studentsTable} s
      LEFT JOIN ${classroomsTable} c ON c.classroom_id = s.class_name
      WHERE ${studentConditions.join(' AND ')}
      ORDER BY ${classroomOrderSql('c.name')}, s.section ASC, s.roll_number ASC, s.first_name ASC
    `, studentValues);

    if (!students.length) {
      return res.status(200).json({
        success: true,
        data: {
          school: schoolRows[0] || null,
          academic_year: academicYear,
          cards: [],
          summary: { students: 0, average_percentage: 0, pass_rate: 0, attendance_rate: 0 }
        }
      });
    }

    const studentIds = students.map((student) => student.student_id);
    const resultValues = [clientId, studentIds, academicYear];
    const resultDateConditions = [];
    if (dateFrom) {
      resultDateConditions.push('e.exam_date >= ?');
      resultValues.push(dateFrom);
    }
    if (dateTo) {
      resultDateConditions.push('e.exam_date <= ?');
      resultValues.push(dateTo);
    }

    const [results] = await db.query(`
      SELECT
        er.exam_resu_id,
        er.student_id,
        er.exam_id,
        er.marks_obtained,
        er.status,
        e.exam_type,
        e.exam_date,
        e.total_marks,
        e.passing_marks,
        sub.sub_name AS subject_name
      FROM ${examResultsTable} er
      INNER JOIN ${examsTable} e ON e.exam_id = er.exam_id
      LEFT JOIN ${subjectsTable} sub ON sub.subject_id = e.subject_id
      WHERE er.client_id = ?
        AND er.student_id IN (?)
        AND (e.academic_year = ? OR e.academic_year IS NULL OR e.academic_year = '')
        ${resultDateConditions.length ? `AND ${resultDateConditions.join(' AND ')}` : ''}
      ORDER BY e.exam_date ASC, sub.sub_name ASC, e.exam_type ASC
    `, resultValues);

    const attendanceValues = [clientId, studentIds];
    const attendanceDateConditions = [];
    if (dateFrom) {
      attendanceDateConditions.push('attendance_date >= ?');
      attendanceValues.push(dateFrom);
    }
    if (dateTo) {
      attendanceDateConditions.push('attendance_date <= ?');
      attendanceValues.push(dateTo);
    }

    const [attendanceRows] = await db.query(`
      SELECT
        student_id,
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late,
        SUM(CASE WHEN status = 'Leave' THEN 1 ELSE 0 END) AS leave_count
      FROM ${studentAttendanceTable}
      WHERE client_id = ?
        AND student_id IN (?)
        ${attendanceDateConditions.length ? `AND ${attendanceDateConditions.join(' AND ')}` : ''}
      GROUP BY student_id
    `, attendanceValues);

    const resultsByStudent = new Map();
    results.forEach((row) => {
      const key = Number(row.student_id);
      const existing = resultsByStudent.get(key) || [];
      existing.push(row);
      resultsByStudent.set(key, existing);
    });

    const attendanceByStudent = new Map(attendanceRows.map((row) => [Number(row.student_id), row]));

    const cards = students.map((student) => {
      const studentResults = resultsByStudent.get(Number(student.student_id)) || [];
      const totalObtained = studentResults.reduce((sum, row) => {
        return sum + (String(row.status).toUpperCase() === 'ABSENT' ? 0 : Number(row.marks_obtained || 0));
      }, 0);
      const totalMarks = studentResults.reduce((sum, row) => sum + Number(row.total_marks || 0), 0);
      const passed = studentResults.filter((row) => String(row.status).toUpperCase() === 'PASS').length;
      const failed = studentResults.filter((row) => String(row.status).toUpperCase() === 'FAIL').length;
      const absent = studentResults.filter((row) => String(row.status).toUpperCase() === 'ABSENT').length;
      const percentage = percent(totalObtained, totalMarks);
      const attendance = attendanceByStudent.get(Number(student.student_id)) || {
        total: Number(student.total_days_present || 0) + Number(student.total_days_absent || 0),
        present: Number(student.total_days_present || 0),
        absent: Number(student.total_days_absent || 0),
        late: 0,
        leave_count: 0
      };
      const attendanceRate = percent(attendance.present, attendance.total);
      const card = {
        ...student,
        academic_year: student.academic_year || academicYear,
        parent_name: student.guardian_name || student.father_name || student.mother_name || '',
        results: studentResults.map((row) => ({
          exam_result_id: row.exam_resu_id,
          exam_id: row.exam_id,
          subject_name: row.subject_name || 'Subject',
          exam_type: row.exam_type || 'Exam',
          exam_date: row.exam_date,
          marks_obtained: Number(row.marks_obtained || 0),
          total_marks: Number(row.total_marks || 0),
          passing_marks: Number(row.passing_marks || 0),
          percentage: percent(row.marks_obtained, row.total_marks),
          status: row.status
        })),
        totals: {
          obtained: totalObtained,
          marks: totalMarks,
          percentage,
          grade: gradeForPercentage(percentage),
          passed,
          failed,
          absent
        },
        attendance: {
          total: Number(attendance.total || 0),
          present: Number(attendance.present || 0),
          absent: Number(attendance.absent || 0),
          late: Number(attendance.late || 0),
          leave: Number(attendance.leave_count || 0),
          percentage: attendanceRate
        },
        pass_rate: percent(passed, studentResults.length),
        attendance_rate: attendanceRate
      };

      return {
        ...card,
        remarks: remarksForCard(card)
      };
    });

    const cardsWithResults = cards.filter((card) => card.results.length);
    const summary = {
      students: cards.length,
      average_percentage: cardsWithResults.length
        ? Math.round(cardsWithResults.reduce((sum, card) => sum + card.totals.percentage, 0) / cardsWithResults.length)
        : 0,
      pass_rate: cardsWithResults.length
        ? Math.round(cardsWithResults.reduce((sum, card) => sum + card.pass_rate, 0) / cardsWithResults.length)
        : 0,
      attendance_rate: cards.length
        ? Math.round(cards.reduce((sum, card) => sum + card.attendance.percentage, 0) / cards.length)
        : 0
    };

    return res.status(200).json({
      success: true,
      data: {
        school: schoolRows[0] || null,
        academic_year: academicYear,
        date_from: dateFrom,
        date_to: dateTo,
        cards,
        summary
      }
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function sendProgressCardsWhatsapp(req, res) {
  try {
    const clientId = normalizePositiveInteger(req.body.clientId || req.body.client_id || req.query.client_id || req.decoded?.client_id);
    const classroomId = normalizePositiveInteger(req.body.classroomId || req.body.classroom_id);
    const studentId = normalizePositiveInteger(req.body.studentId || req.body.student_id);
    const academicYear = normalizeText(req.body.academicYear || req.body.academic_year, currentAcademicYear());
    const dateFrom = normalizeDate(req.body.dateFrom || req.body.date_from);
    const dateTo = normalizeDate(req.body.dateTo || req.body.date_to);

    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Client id is required' });
    }

    const studentConditions = ['s.client_id = ?'];
    const studentValues = [clientId];
    if (classroomId) {
      studentConditions.push('s.class_name = ?');
      studentValues.push(classroomId);
    }
    if (studentId) {
      studentConditions.push('s.student_id = ?');
      studentValues.push(studentId);
    }

    const [schoolRows] = await db.query(`
      SELECT client_name
      FROM ${clientMasterTable}
      WHERE client_id = ?
      LIMIT 1
    `, [clientId]);
    const schoolName = schoolRows[0]?.client_name || 'School';

    const [students] = await db.query(`
      SELECT
        s.student_id,
        s.client_id,
        s.admission_number,
        CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
        c.name AS classroom_name,
        s.section,
        s.father_name,
        s.father_contact,
        s.mother_name,
        s.mother_contact,
        s.guardian_name,
        s.guardian_contact,
        s.phone_number
      FROM ${studentsTable} s
      LEFT JOIN ${classroomsTable} c ON c.classroom_id = s.class_name
      WHERE ${studentConditions.join(' AND ')}
      ORDER BY ${classroomOrderSql('c.name')}, s.section ASC, s.first_name ASC
    `, studentValues);

    if (!students.length) {
      return res.status(404).json({ success: false, message: 'No students found for WhatsApp progress card.' });
    }

    const studentIds = students.map((student) => student.student_id);
    const resultValues = [clientId, studentIds, academicYear];
    const resultDateConditions = [];
    if (dateFrom) {
      resultDateConditions.push('e.exam_date >= ?');
      resultValues.push(dateFrom);
    }
    if (dateTo) {
      resultDateConditions.push('e.exam_date <= ?');
      resultValues.push(dateTo);
    }

    const [resultRows] = await db.query(`
      SELECT
        er.student_id,
        SUM(CASE WHEN er.status = 'ABSENT' THEN 0 ELSE COALESCE(er.marks_obtained, 0) END) AS obtained,
        SUM(COALESCE(e.total_marks, 0)) AS total_marks,
        SUM(CASE WHEN er.status = 'PASS' THEN 1 ELSE 0 END) AS passed,
        SUM(CASE WHEN er.status = 'FAIL' THEN 1 ELSE 0 END) AS failed,
        SUM(CASE WHEN er.status = 'ABSENT' THEN 1 ELSE 0 END) AS absent,
        COUNT(*) AS result_count
      FROM ${examResultsTable} er
      INNER JOIN ${examsTable} e ON e.exam_id = er.exam_id
      WHERE er.client_id = ?
        AND er.student_id IN (?)
        AND (e.academic_year = ? OR e.academic_year IS NULL OR e.academic_year = '')
        ${resultDateConditions.length ? `AND ${resultDateConditions.join(' AND ')}` : ''}
      GROUP BY er.student_id
    `, resultValues);

    const attendanceValues = [clientId, studentIds];
    const attendanceDateConditions = [];
    if (dateFrom) {
      attendanceDateConditions.push('attendance_date >= ?');
      attendanceValues.push(dateFrom);
    }
    if (dateTo) {
      attendanceDateConditions.push('attendance_date <= ?');
      attendanceValues.push(dateTo);
    }

    const [attendanceRows] = await db.query(`
      SELECT
        student_id,
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present
      FROM ${studentAttendanceTable}
      WHERE client_id = ?
        AND student_id IN (?)
        ${attendanceDateConditions.length ? `AND ${attendanceDateConditions.join(' AND ')}` : ''}
      GROUP BY student_id
    `, attendanceValues);

    const resultMap = new Map(resultRows.map((row) => [Number(row.student_id), row]));
    const attendanceMap = new Map(attendanceRows.map((row) => [Number(row.student_id), row]));
    let sent = 0;
    let skipped = 0;
    let failed = 0;
    const details = [];

    for (const student of students) {
      const phone = parentPhone(student);
      const result = resultMap.get(Number(student.student_id)) || {};
      const attendance = attendanceMap.get(Number(student.student_id)) || {};
      const obtained = Number(result.obtained || 0);
      const totalMarks = Number(result.total_marks || 0);
      const percentage = percent(obtained, totalMarks);
      const attendancePercentage = percent(attendance.present, attendance.total);
      const cardSummary = {
        academic_year: academicYear,
        obtained,
        total_marks: totalMarks,
        percentage,
        grade: gradeForPercentage(percentage),
        passed: Number(result.passed || 0),
        failed: Number(result.failed || 0),
        absent: Number(result.absent || 0),
        attendance_percentage: attendancePercentage,
        results: Array.from({ length: Number(result.result_count || 0) }),
        pass_rate: percent(result.passed, result.result_count),
        attendance_rate: attendancePercentage
      };
      cardSummary.remarks = remarksForCard(cardSummary);

      if (!phone) {
        skipped += 1;
        details.push({ student_id: student.student_id, student_name: student.student_name, status: 'SKIPPED', message: 'Parent phone not found' });
        continue;
      }

      const sendResult = await whatsapp.sendMessage({
        clientId,
        to: phone,
        body: progressMessage(student, schoolName, cardSummary),
        moduleName: 'REPORTS',
        eventName: 'PROGRESS_CARD',
        recipientType: 'PARENT',
        recipientName: student.guardian_name || student.father_name || student.mother_name || 'Parent',
        studentId: student.student_id
      });

      if (sendResult.success) {
        sent += 1;
      } else if (sendResult.skipped) {
        skipped += 1;
      } else {
        failed += 1;
      }

      details.push({
        student_id: student.student_id,
        student_name: student.student_name,
        status: sendResult.success ? 'SENT' : sendResult.skipped ? 'SKIPPED' : 'FAILED',
        message: sendResult.message || ''
      });
    }

    return res.status(200).json({
      success: failed === 0,
      message: `Progress card WhatsApp completed. ${sent} sent, ${skipped} skipped, ${failed} failed.`,
      data: { sent, skipped, failed, details }
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function getOperationalReports(req, res) {
  try {
    const clientId = normalizePositiveInteger(req.query.client_id || req.decoded?.client_id);
    const classroomId = normalizePositiveInteger(req.query.classroom_id || req.query.class_id);
    const examId = normalizePositiveInteger(req.query.exam_id);
    const feeCategory = normalizeText(req.query.fee_category, 'ALL');
    const dateFrom = normalizeDate(req.query.date_from);
    const dateTo = normalizeDate(req.query.date_to);
    const academicYear = normalizeText(req.query.academic_year, currentAcademicYear());

    if (!clientId) {
      return res.status(400).json({ success: false, message: 'Client id is required' });
    }

    const feeScope = feeCategoryExpression(feeCategory);
    const feePaymentConditions = ['fp.client_id = ?'];
    const feePaymentValues = [clientId];
    if (classroomId) {
      feePaymentConditions.push('fr.classroom_id = ?');
      feePaymentValues.push(classroomId);
    }
    if (dateFrom) {
      feePaymentConditions.push('fp.payment_date >= ?');
      feePaymentValues.push(dateFrom);
    }
    if (dateTo) {
      feePaymentConditions.push('fp.payment_date <= ?');
      feePaymentValues.push(dateTo);
    }

    const feeRecordConditions = ['fr.client_id = ?'];
    const feeRecordValues = [clientId];
    if (classroomId) {
      feeRecordConditions.push('fr.classroom_id = ?');
      feeRecordValues.push(classroomId);
    }
    if (academicYear) {
      feeRecordConditions.push('(fr.fee_year = ? OR fr.fee_year = ? OR fr.fee_year IS NULL OR fr.fee_year = \'\')');
      feeRecordValues.push(academicYear, academicYear.split('-')[0]);
    }

    const [dayWiseFees] = await db.query(`
      SELECT
        fp.payment_date,
        COUNT(DISTINCT fp.payment_id) AS receipt_count,
        SUM(fp.amount) AS collected_amount,
        SUM(CASE WHEN fr.due_balance > 0 THEN 1 ELSE 0 END) AS pending_records
      FROM ${feePaymentsTable} fp
      INNER JOIN ${feeRecordsTable} fr ON fr.fee_id = fp.fee_id
      WHERE ${feePaymentConditions.join(' AND ')}
      GROUP BY fp.payment_date
      ORDER BY fp.payment_date DESC
    `, feePaymentValues);

    const [pendingFees] = await db.query(`
      SELECT
        fr.fee_id,
        fr.fee_reg_no,
        fr.student_id,
        CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
        s.admission_number,
        c.name AS classroom_name,
        fr.fee_year,
        ${feeScope} AS category_total,
        COALESCE(fr.deposit, 0) AS paid_amount,
        CASE
          WHEN ? = 'ALL' THEN COALESCE(fr.due_balance, 0)
          ELSE GREATEST(${feeScope} - COALESCE(fr.deposit, 0), 0)
        END AS due_amount
      FROM ${feeRecordsTable} fr
      INNER JOIN ${studentsTable} s ON s.student_id = fr.student_id
      LEFT JOIN ${classroomsTable} c ON c.classroom_id = fr.classroom_id
      WHERE ${feeRecordConditions.join(' AND ')}
      HAVING due_amount > 0
      ORDER BY ${classroomOrderSql('c.name')}, s.first_name ASC
    `, [String(feeCategory || 'ALL').toUpperCase(), ...feeRecordValues]);

    const hostelConditions = ['sra.client_id = ?'];
    const hostelValues = [clientId];
    if (classroomId) {
      hostelConditions.push('s.class_name = ?');
      hostelValues.push(classroomId);
    }

    const hostelPaymentDateConditions = [];
    const hostelPaymentValues = [];
    if (dateFrom) {
      hostelPaymentDateConditions.push('hp.payment_date >= ?');
      hostelPaymentValues.push(dateFrom);
    }
    if (dateTo) {
      hostelPaymentDateConditions.push('hp.payment_date <= ?');
      hostelPaymentValues.push(dateTo);
    }

    const [hostelClassWise] = await db.query(`
      SELECT
        c.classroom_id,
        c.name AS classroom_name,
        COUNT(DISTINCT sra.assignment_id) AS assigned_students,
        SUM(COALESCE(hr.fee, 0)) AS hostel_fee_total,
        COALESCE(SUM(hp.amount), 0) AS collected_amount,
        GREATEST(SUM(COALESCE(hr.fee, 0)) - COALESCE(SUM(hp.amount), 0), 0) AS due_amount
      FROM ${hostelAssignmentsTable} sra
      INNER JOIN ${studentsTable} s ON s.student_id = sra.student_id
      LEFT JOIN ${classroomsTable} c ON c.classroom_id = s.class_name
      INNER JOIN ${hostelRoomsTable} hr ON hr.room_id = sra.room_id
      LEFT JOIN ${hostelPaymentsTable} hp ON hp.assignment_id = sra.assignment_id
        ${hostelPaymentDateConditions.length ? `AND ${hostelPaymentDateConditions.join(' AND ')}` : ''}
      WHERE ${hostelConditions.join(' AND ')}
      GROUP BY c.classroom_id, c.name
      ORDER BY ${classroomOrderSql('c.name')}
    `, [...hostelPaymentValues, ...hostelValues]);

    const transportConditions = ['s.client_id = ?'];
    const transportValues = [clientId];
    if (classroomId) {
      transportConditions.push('s.class_name = ?');
      transportValues.push(classroomId);
    }

    const [transportWise] = await db.query(`
      SELECT
        t.transport_id,
        t.vehicleNumber AS vehicle_number,
        t.route,
        t.capacity,
        t.departureTime AS departure_time,
        COUNT(s.student_id) AS student_count,
        GROUP_CONCAT(CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) ORDER BY s.first_name SEPARATOR ', ') AS students
      FROM ${transportsTable} t
      LEFT JOIN ${studentsTable} s ON s.transport_id = t.transport_id
        AND ${transportConditions.join(' AND ')}
      WHERE t.client_id = ?
      GROUP BY t.transport_id, t.vehicleNumber, t.route, t.capacity, t.departureTime
      ORDER BY t.route ASC, t.vehicleNumber ASC
    `, [...transportValues, clientId]);

    const hallTicketConditions = ['s.client_id = ?'];
    const hallTicketValues = [clientId];
    if (classroomId) {
      hallTicketConditions.push('s.class_name = ?');
      hallTicketValues.push(classroomId);
    }

    const examConditions = ['e.client_id = ?'];
    const examValues = [clientId];
    if (examId) {
      examConditions.push('e.exam_id = ?');
      examValues.push(examId);
    }
    if (academicYear) {
      examConditions.push('(e.academic_year = ? OR e.academic_year IS NULL OR e.academic_year = \'\')');
      examValues.push(academicYear);
    }
    if (dateFrom) {
      examConditions.push('e.exam_date >= ?');
      examValues.push(dateFrom);
    }
    if (dateTo) {
      examConditions.push('e.exam_date <= ?');
      examValues.push(dateTo);
    }

    const [hallTickets] = await db.query(`
      SELECT
        s.student_id,
        s.admission_number,
        CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
        s.roll_number,
        c.name AS classroom_name,
        s.section,
        e.exam_id,
        e.exam_type,
        e.exam_date,
        e.duration,
        sub.sub_name AS subject_name
      FROM ${studentsTable} s
      INNER JOIN ${classroomsTable} c ON c.classroom_id = s.class_name
      INNER JOIN ${subjectsTable} sub ON sub.classroom_id = c.classroom_id
      INNER JOIN ${examsTable} e ON e.subject_id = sub.subject_id
        AND ${examConditions.join(' AND ')}
      WHERE ${hallTicketConditions.join(' AND ')}
      ORDER BY ${classroomOrderSql('c.name')}, s.section ASC, s.roll_number ASC, e.exam_date ASC, sub.sub_name ASC
    `, [...examValues, ...hallTicketValues]);

    const feeSummary = {
      collected: dayWiseFees.reduce((sum, row) => sum + Number(row.collected_amount || 0), 0),
      pending: pendingFees.reduce((sum, row) => sum + Number(row.due_amount || 0), 0),
      pending_students: pendingFees.length
    };
    const hostelSummary = {
      collected: hostelClassWise.reduce((sum, row) => sum + Number(row.collected_amount || 0), 0),
      pending: hostelClassWise.reduce((sum, row) => sum + Number(row.due_amount || 0), 0),
      assigned_students: hostelClassWise.reduce((sum, row) => sum + Number(row.assigned_students || 0), 0)
    };

    return res.status(200).json({
      success: true,
      data: {
        filters: { client_id: clientId, classroom_id: classroomId, exam_id: examId, fee_category: feeCategory, academic_year: academicYear, date_from: dateFrom, date_to: dateTo },
        summary: {
          fee: feeSummary,
          hostel: hostelSummary,
          transport_students: transportWise.reduce((sum, row) => sum + Number(row.student_count || 0), 0),
          hall_tickets: hallTickets.length
        },
        dayWiseFees,
        pendingFees,
        hostelClassWise,
        transportWise,
        hallTickets
      }
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

module.exports = {
  getProgressCards,
  sendProgressCardsWhatsapp,
  getOperationalReports
};
