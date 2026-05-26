const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const examsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('exams')}`;
const examResultsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('exam_results')}`;
const subjectsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('subjects')}`;
const classroomsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('classrooms')}`;
const studentsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('students')}`;
const schedulesTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('class_schedule')}`;
const teachersTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('teachers')}`;

const selectableColumns = `
  e.exam_id,
  e.client_id,
  e.subject_id,
  s.classroom_id,
  s.sub_name AS subject_name,
  s.marks AS subject_marks,
  c.name AS classroom_name,
  (
    SELECT GROUP_CONCAT(DISTINCT CONCAT(t.first_name, ' ', t.last_name) ORDER BY t.first_name SEPARATOR ', ')
    FROM ${schedulesTable} cs
    LEFT JOIN ${teachersTable} t ON t.teacher_id = cs.teacher_id
    WHERE cs.classroom_id = s.classroom_id
      AND cs.client_id = e.client_id
      AND LOWER(TRIM(cs.subject)) COLLATE utf8mb4_0900_ai_ci = LOWER(TRIM(s.sub_name)) COLLATE utf8mb4_0900_ai_ci
      AND (cs.status IS NULL OR cs.status = 'Active')
  ) AS teacher_name,
  e.exam_date,
  e.total_marks,
  e.passing_marks,
  e.duration,
  e.created_at
`;

const resultSelectableColumns = `
  er.exam_resu_id,
  er.client_id,
  er.exam_id,
  er.student_id,
  CONCAT_WS(' ', st.first_name, st.middle_name, st.last_name) AS student_name,
  st.admission_number,
  st.grade_level,
  st.section,
  e.subject_id,
  s.classroom_id,
  s.sub_name AS subject_name,
  c.name AS classroom_name,
  e.exam_date,
  e.total_marks,
  e.passing_marks,
  er.marks_obtained,
  er.status,
  er.created_at
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

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function normalizeNonNegativeInteger(value) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function normalizeResultStatus(value) {
  const normalized = String(value || '').trim().toUpperCase();

  if (normalized === 'ABSENT') {
    return 'ABSENT';
  }

  return null;
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

function buildExamPayload(body) {
  return {
    client_id: normalizePositiveInteger(getValue(body, 'clientId', 'client_id')),
    subject_id: normalizePositiveInteger(getValue(body, 'subjectId', 'subject_id')),
    exam_date: normalizeDate(getValue(body, 'examDate', 'exam_date')),
    total_marks: normalizePositiveInteger(getValue(body, 'totalMarks', 'total_marks')),
    passing_marks: normalizePositiveInteger(getValue(body, 'passingMarks', 'passing_marks')),
    duration: normalizePositiveInteger(getValue(body, 'duration'))
  };
}

function buildExamResultPayload(body) {
  const status = normalizeResultStatus(getValue(body, 'resultStatus', 'status'));

  return {
    client_id: normalizePositiveInteger(getValue(body, 'clientId', 'client_id')),
    exam_id: normalizePositiveInteger(getValue(body, 'examId', 'exam_id')),
    student_id: normalizePositiveInteger(getValue(body, 'studentId', 'student_id')),
    marks_obtained: normalizeNonNegativeInteger(getValue(body, 'marksObtained', 'marks_obtained', status === 'ABSENT' ? 0 : undefined)),
    status
  };
}

function validateExamPayload(payload) {
  if (!payload.client_id || !payload.subject_id || !payload.exam_date || !payload.total_marks || !payload.passing_marks || !payload.duration) {
    return 'Client, subject, date, total marks, passing marks, and duration are required';
  }

  if (payload.passing_marks > payload.total_marks) {
    return 'Passing marks cannot be greater than total marks';
  }

  return '';
}

function getExams(req, res) {
  const { client_id, subject_id, upcoming } = req.query;
  const conditions = [];
  const values = [];

  if (client_id) {
    conditions.push('e.client_id = ?');
    values.push(client_id);
  }

  if (subject_id) {
    conditions.push('e.subject_id = ?');
    values.push(subject_id);
  }

  if (upcoming === 'true') {
    conditions.push('e.exam_date >= CURDATE()');
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT ${selectableColumns}
    FROM ${examsTable} e
    LEFT JOIN ${subjectsTable} s ON s.subject_id = e.subject_id
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = s.classroom_id
    ${whereClause}
    ORDER BY e.exam_date ASC, e.exam_id DESC
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

function getExamById(req, res) {
  const clientId = req.query.client_id;
  const sql = `
    SELECT ${selectableColumns}
    FROM ${examsTable} e
    LEFT JOIN ${subjectsTable} s ON s.subject_id = e.subject_id
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = s.classroom_id
    WHERE e.exam_id = ? AND (? IS NULL OR e.client_id = ?)
  `;

  pool.query(sql, [req.params.examId, clientId || null, clientId || null], (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: results[0]
    });
  });
}

function createExam(req, res) {
  const payload = buildExamPayload(req.body);
  const validationMessage = validateExamPayload(payload);

  if (validationMessage) {
    return res.status(400).json({
      success: false,
      message: validationMessage
    });
  }

  const subjectSql = `SELECT subject_id FROM ${subjectsTable} WHERE subject_id = ? AND client_id = ?`;

  pool.query(subjectSql, [payload.subject_id, payload.client_id], (subjectError, subjects) => {
    if (subjectError) {
      return sendDatabaseError(res, subjectError);
    }

    if (!subjects.length) {
      return res.status(400).json({
        success: false,
        message: 'Choose a valid subject for this client before creating an exam'
      });
    }

    pool.query(`INSERT INTO ${examsTable} SET ?`, payload, (error, result) => {
      if (error) {
        return sendDatabaseError(res, error);
      }

      return res.status(201).json({
        success: true,
        message: 'Exam created successfully',
        exam_id: result.insertId
      });
    });
  });
}

function updateExam(req, res) {
  const payload = buildExamPayload(req.body);
  const updates = {};

  Object.entries(payload).forEach(([key, value]) => {
    const hasCamel = req.body[key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())] !== undefined;
    const hasSnake = req.body[key] !== undefined;

    if ((hasCamel || hasSnake) && value !== null) {
      updates[key] = value;
    }
  });

  if (!Object.keys(updates).length) {
    return res.status(400).json({
      success: false,
      message: 'No updatable fields were provided'
    });
  }

  if (updates.passing_marks && updates.total_marks && updates.passing_marks > updates.total_marks) {
    return res.status(400).json({
      success: false,
      message: 'Passing marks cannot be greater than total marks'
    });
  }

  pool.query(`UPDATE ${examsTable} SET ? WHERE exam_id = ?`, [updates, req.params.examId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Exam updated successfully'
    });
  });
}

function deleteExam(req, res) {
  pool.query(`DELETE FROM ${examsTable} WHERE exam_id = ?`, [req.params.examId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Exam deleted successfully'
    });
  });
}

function getExamResults(req, res) {
  const clientId = req.query.client_id;
  const examId = req.params.examId || req.query.exam_id;
  const studentId = req.query.student_id;
  const conditions = [];
  const values = [];

  if (clientId) {
    conditions.push('er.client_id = ?');
    values.push(clientId);
  }

  if (examId) {
    conditions.push('er.exam_id = ?');
    values.push(examId);
  }

  if (studentId) {
    conditions.push('er.student_id = ?');
    values.push(studentId);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT ${resultSelectableColumns}
    FROM ${examResultsTable} er
    INNER JOIN ${examsTable} e ON e.exam_id = er.exam_id
    LEFT JOIN ${subjectsTable} s ON s.subject_id = e.subject_id
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = s.classroom_id
    LEFT JOIN ${studentsTable} st ON st.student_id = er.student_id
    ${whereClause}
    ORDER BY er.created_at DESC, er.exam_resu_id DESC
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

function createExamResult(req, res) {
  const payload = buildExamResultPayload(req.body);

  if (!payload.client_id || !payload.exam_id || !payload.student_id || payload.marks_obtained === null) {
    return res.status(400).json({
      success: false,
      message: 'Client, exam, student, and marks obtained are required'
    });
  }

  const examSql = `
    SELECT e.exam_id, e.total_marks, e.passing_marks, s.classroom_id
    FROM ${examsTable} e
    LEFT JOIN ${subjectsTable} s ON s.subject_id = e.subject_id
    WHERE e.exam_id = ? AND e.client_id = ?
  `;

  pool.query(examSql, [payload.exam_id, payload.client_id], (examError, exams) => {
    if (examError) {
      return sendDatabaseError(res, examError);
    }

    if (!exams.length) {
      return res.status(400).json({
        success: false,
        message: 'Choose a valid exam for this client before saving results'
      });
    }

    const exam = exams[0];

    if (payload.status !== 'ABSENT' && payload.marks_obtained > exam.total_marks) {
      return res.status(400).json({
        success: false,
        message: 'Marks obtained cannot be greater than total marks'
      });
    }

    const studentSql = `
      SELECT student_id
      FROM ${studentsTable}
      WHERE student_id = ?
        AND (? IS NULL OR client_id = ?)
        AND (? IS NULL OR class_name = ?)
    `;

    pool.query(studentSql, [payload.student_id, payload.client_id, payload.client_id, exam.classroom_id || null, exam.classroom_id || null], (studentError, students) => {
      if (studentError) {
        return sendDatabaseError(res, studentError);
      }

      if (!students.length) {
        return res.status(400).json({
          success: false,
          message: 'Choose a valid student for this client before saving results'
        });
      }

      const duplicateSql = `SELECT exam_resu_id FROM ${examResultsTable} WHERE exam_id = ? AND student_id = ? AND (? IS NULL OR client_id = ?)`;

      pool.query(duplicateSql, [payload.exam_id, payload.student_id, payload.client_id, payload.client_id], (duplicateError, duplicateResults) => {
        if (duplicateError) {
          return sendDatabaseError(res, duplicateError);
        }

        if (duplicateResults.length) {
          return res.status(409).json({
            success: false,
            message: 'Result is already entered for this student in the selected exam'
          });
        }

        payload.status = payload.status === 'ABSENT'
          ? 'ABSENT'
          : payload.marks_obtained >= exam.passing_marks ? 'PASS' : 'FAIL';

        pool.query(`INSERT INTO ${examResultsTable} SET ?`, payload, (error, result) => {
          if (error) {
            return sendDatabaseError(res, error);
          }

          return res.status(201).json({
            success: true,
            message: 'Exam result saved successfully',
            exam_resu_id: result.insertId,
            status: payload.status
          });
        });
      });
    });
  });
}

function deleteExamResult(req, res) {
  pool.query(`DELETE FROM ${examResultsTable} WHERE exam_resu_id = ?`, [req.params.resultId], (error, result) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'Exam result not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Exam result deleted successfully'
    });
  });
}

module.exports = {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getExamResults,
  createExamResult,
  deleteExamResult
};
