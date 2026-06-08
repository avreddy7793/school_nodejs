const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const examsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('exams')}`;
const examResultsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('exam_results')}`;
const subjectsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('subjects')}`;
const classroomsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('classrooms')}`;
const studentsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('students')}`;
const schedulesTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('class_schedule')}`;
const teachersTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('teachers')}`;
const syllabusUnitsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('syllabus_units')}`;
const syllabusPlansTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('syllabus_plans')}`;
const examTypes = ['Month Test', 'Unit Test 1', 'Unit Test 2', 'Half Yearly', 'Unit Test 3', 'Unit Test 4', 'Pre Final', 'Final Exam', 'Online', 'Other'];
let examWorkflowSchemaReady = false;

const selectableColumns = `
  e.exam_id,
  e.client_id,
  e.subject_id,
  e.exam_type,
  e.syllabus_unit_id,
  su.unit_title AS syllabus_unit_title,
  e.academic_year,
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
      AND cs.subject_id = s.subject_id
      AND (cs.status IS NULL OR cs.status = 'Active')
  ) AS teacher_name,
  e.exam_date,
  e.total_marks,
  e.passing_marks,
  e.duration,
  COALESCE(e.exam_status, 'OPEN') AS exam_status,
  e.closed_at,
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
  e.exam_type,
  e.syllabus_unit_id,
  su.unit_title AS syllabus_unit_title,
  e.academic_year,
  s.classroom_id,
  s.sub_name AS subject_name,
  c.name AS classroom_name,
  e.exam_date,
  e.total_marks,
  e.passing_marks,
  COALESCE(e.exam_status, 'OPEN') AS exam_status,
  e.closed_at,
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

function ensureExamWorkflowSchema(callback) {
  if (examWorkflowSchemaReady) {
    callback();
    return;
  }

  ensureColumn(examsTable, 'exam_status', "ENUM('OPEN','CLOSED') NOT NULL DEFAULT 'OPEN' AFTER duration", (statusError) => {
    if (statusError) {
      callback(statusError);
      return;
    }

    ensureColumn(examsTable, 'closed_at', 'TIMESTAMP NULL DEFAULT NULL AFTER exam_status', (closedAtError) => {
      if (closedAtError) {
        callback(closedAtError);
        return;
      }

      ensureExamTypeColumn((typeError) => {
        if (typeError) {
          callback(typeError);
          return;
        }

        examWorkflowSchemaReady = true;
        callback();
      });
    });
  });
}

function ensureExamTypeColumn(callback) {
  const enumValues = examTypes.map((type) => `'${type.replace(/'/g, "''")}'`).join(',');
  pool.query(`
    ALTER TABLE ${examsTable}
    MODIFY exam_type ENUM(${enumValues}) NOT NULL DEFAULT 'Other'
  `, callback);
}

function ensureColumn(tableName, columnName, definition, callback) {
  pool.query(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [columnName], (showError, columns) => {
    if (showError) {
      callback(showError);
      return;
    }

    if (columns.length) {
      callback();
      return;
    }

    pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${escapeIdentifier(columnName)} ${definition}`, callback);
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

function normalizeOptionalPositiveInteger(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return normalizePositiveInteger(value);
}

function normalizeString(value, fallback = null) {
  if (value === undefined || value === null) {
    return fallback;
  }

  const trimmed = String(value).trim();
  return trimmed || fallback;
}

function normalizeExamType(value) {
  const normalized = normalizeString(value, 'Other');
  return examTypes.includes(normalized) ? normalized : 'Other';
}

function currentAcademicYear() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getFullYear() + 1}`;
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
    exam_type: normalizeExamType(getValue(body, 'examType', 'exam_type')),
    syllabus_unit_id: normalizeOptionalPositiveInteger(getValue(body, 'syllabusUnitId', 'syllabus_unit_id')),
    academic_year: normalizeString(getValue(body, 'academicYear', 'academic_year'), currentAcademicYear()),
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
  return ensureExamWorkflowSchema((schemaError) => {
    if (schemaError) {
      return sendDatabaseError(res, schemaError);
    }

  const { client_id, subject_id, upcoming, teacher_id } = req.query;
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

  if (teacher_id) {
    conditions.push(`EXISTS (
      SELECT 1
      FROM ${schedulesTable} teacher_cs
      WHERE teacher_cs.classroom_id = s.classroom_id
        AND teacher_cs.subject_id = e.subject_id
        AND teacher_cs.client_id = e.client_id
        AND teacher_cs.teacher_id = ?
        AND (teacher_cs.status IS NULL OR teacher_cs.status = 'Active')
    )`);
    values.push(teacher_id);
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
    LEFT JOIN ${syllabusUnitsTable} su ON su.syllabus_unit_id = e.syllabus_unit_id
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
  });
}

function getExamById(req, res) {
  return ensureExamWorkflowSchema((schemaError) => {
    if (schemaError) {
      return sendDatabaseError(res, schemaError);
    }

  const clientId = req.query.client_id;
  const sql = `
    SELECT ${selectableColumns}
    FROM ${examsTable} e
    LEFT JOIN ${subjectsTable} s ON s.subject_id = e.subject_id
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = s.classroom_id
    LEFT JOIN ${syllabusUnitsTable} su ON su.syllabus_unit_id = e.syllabus_unit_id
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
  });
}

function createExam(req, res) {
  const payload = buildExamPayload(req.body);
  const teacherId = normalizeOptionalPositiveInteger(getValue(req.body, 'teacherId', 'teacher_id'));
  const validationMessage = validateExamPayload(payload);

  if (validationMessage) {
    return res.status(400).json({
      success: false,
      message: validationMessage
    });
  }

  const subjectSql = `SELECT subject_id, classroom_id FROM ${subjectsTable} WHERE subject_id = ? AND client_id = ?`;

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

    validateTeacherExamScope(payload, subjects[0], teacherId, (scopeError, scopeMessage) => {
      if (scopeError) {
        return sendDatabaseError(res, scopeError);
      }

      if (scopeMessage) {
        return res.status(403).json({
          success: false,
          message: scopeMessage
        });
      }

      validateSyllabusUnit(payload, subjects[0], (unitError, unitMessage) => {
      if (unitError) {
        return sendDatabaseError(res, unitError);
      }

      if (unitMessage) {
        return res.status(400).json({
          success: false,
          message: unitMessage
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
    });
  });
}

function validateTeacherExamScope(payload, subject, teacherId, callback) {
  if (!teacherId) {
    callback(null, '');
    return;
  }

  const sql = `
    SELECT schedule_id
    FROM ${schedulesTable}
    WHERE client_id = ?
      AND classroom_id = ?
      AND subject_id = ?
      AND teacher_id = ?
      AND (status IS NULL OR status = 'Active')
    LIMIT 1
  `;

  pool.query(sql, [payload.client_id, subject.classroom_id, payload.subject_id, teacherId], (error, rows) => {
    if (error) {
      callback(error);
      return;
    }

    callback(null, rows.length ? '' : 'Teacher can create exams only for assigned subjects');
  });
}

function validateSyllabusUnit(payload, subject, callback) {
  if (!payload.syllabus_unit_id) {
    callback(null, '');
    return;
  }

  const sql = `
    SELECT su.syllabus_unit_id
    FROM ${syllabusUnitsTable} su
    INNER JOIN ${syllabusPlansTable} sp ON sp.syllabus_plan_id = su.syllabus_plan_id
    WHERE su.syllabus_unit_id = ?
      AND sp.client_id = ?
      AND sp.subject_id = ?
      AND sp.classroom_id = ?
      AND (? IS NULL OR sp.academic_year = ?)
    LIMIT 1
  `;

  pool.query(sql, [
    payload.syllabus_unit_id,
    payload.client_id,
    payload.subject_id,
    subject.classroom_id,
    payload.academic_year || null,
    payload.academic_year || null
  ], (error, rows) => {
    if (error) {
      callback(error);
      return;
    }

    callback(null, rows.length ? '' : 'Choose a valid syllabus unit for this subject and academic year');
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
  return ensureExamWorkflowSchema((schemaError) => {
    if (schemaError) {
      return sendDatabaseError(res, schemaError);
    }

  const clientId = req.query.client_id;
  const examId = req.params.examId || req.query.exam_id;
  const studentId = req.query.student_id;
  const teacherId = req.query.teacher_id;
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

  if (teacherId) {
    conditions.push(`EXISTS (
      SELECT 1
      FROM ${schedulesTable} teacher_cs
      WHERE teacher_cs.classroom_id = s.classroom_id
        AND teacher_cs.subject_id = e.subject_id
        AND teacher_cs.client_id = e.client_id
        AND teacher_cs.teacher_id = ?
        AND (teacher_cs.status IS NULL OR teacher_cs.status = 'Active')
    )`);
    values.push(teacherId);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT ${resultSelectableColumns}
    FROM ${examResultsTable} er
    INNER JOIN ${examsTable} e ON e.exam_id = er.exam_id
    LEFT JOIN ${subjectsTable} s ON s.subject_id = e.subject_id
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = s.classroom_id
    LEFT JOIN ${syllabusUnitsTable} su ON su.syllabus_unit_id = e.syllabus_unit_id
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
  });
}

function createExamResult(req, res) {
  return ensureExamWorkflowSchema((schemaError) => {
    if (schemaError) {
      return sendDatabaseError(res, schemaError);
    }

  const payload = buildExamResultPayload(req.body);
  const teacherId = normalizeOptionalPositiveInteger(getValue(req.body, 'teacherId', 'teacher_id'));

  if (!payload.client_id || !payload.exam_id || !payload.student_id || payload.marks_obtained === null) {
    return res.status(400).json({
      success: false,
      message: 'Client, exam, student, and marks obtained are required'
    });
  }

  const examSql = `
    SELECT e.exam_id, e.subject_id, e.total_marks, e.passing_marks, e.exam_status, s.classroom_id
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

    if (exam.exam_status === 'CLOSED') {
      return res.status(409).json({
        success: false,
        message: 'Exam is closed. Reopen is not available for result changes.'
      });
    }

    if (payload.status !== 'ABSENT' && payload.marks_obtained > exam.total_marks) {
      return res.status(400).json({
        success: false,
        message: 'Marks obtained cannot be greater than total marks'
      });
    }

    validateTeacherExamScope({ ...payload, subject_id: exam.subject_id }, { classroom_id: exam.classroom_id }, teacherId, (scopeError, scopeMessage) => {
      if (scopeError) {
        return sendDatabaseError(res, scopeError);
      }

      if (scopeMessage) {
        return res.status(403).json({
          success: false,
          message: 'Teacher can enter results only for assigned subjects'
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
  });
  });
}

function updateExamResult(req, res) {
  return ensureExamWorkflowSchema((schemaError) => {
    if (schemaError) {
      return sendDatabaseError(res, schemaError);
    }

    const resultId = normalizePositiveInteger(req.params.resultId);
    const marksObtained = normalizeNonNegativeInteger(getValue(req.body, 'marksObtained', 'marks_obtained'));
    const requestedStatus = normalizeResultStatus(getValue(req.body, 'resultStatus', 'status'));
    const teacherId = normalizeOptionalPositiveInteger(getValue(req.body, 'teacherId', 'teacher_id'));

    if (!resultId || marksObtained === null) {
      return res.status(400).json({
        success: false,
        message: 'Valid result and marks obtained are required'
      });
    }

    const sql = `
      SELECT er.exam_resu_id, er.client_id, er.student_id, e.exam_id, e.subject_id, e.total_marks, e.passing_marks, e.exam_status, s.classroom_id
      FROM ${examResultsTable} er
      INNER JOIN ${examsTable} e ON e.exam_id = er.exam_id
      LEFT JOIN ${subjectsTable} s ON s.subject_id = e.subject_id
      WHERE er.exam_resu_id = ?
    `;

    pool.query(sql, [resultId], (findError, rows) => {
      if (findError) {
        return sendDatabaseError(res, findError);
      }

      if (!rows.length) {
        return res.status(404).json({ success: false, message: 'Exam result not found' });
      }

      const row = rows[0];
      if (row.exam_status === 'CLOSED') {
        return res.status(409).json({
          success: false,
          message: 'Exam is closed. Result changes are not allowed.'
        });
      }

      if (requestedStatus !== 'ABSENT' && marksObtained > row.total_marks) {
        return res.status(400).json({
          success: false,
          message: 'Marks obtained cannot be greater than total marks'
        });
      }

      validateTeacherExamScope({ client_id: row.client_id, subject_id: row.subject_id }, { classroom_id: row.classroom_id }, teacherId, (scopeError, scopeMessage) => {
        if (scopeError) {
          return sendDatabaseError(res, scopeError);
        }

        if (scopeMessage) {
          return res.status(403).json({
            success: false,
            message: 'Teacher can edit results only for assigned subjects'
          });
        }

        const status = requestedStatus === 'ABSENT' ? 'ABSENT' : marksObtained >= row.passing_marks ? 'PASS' : 'FAIL';
        pool.query(
          `UPDATE ${examResultsTable} SET marks_obtained = ?, status = ? WHERE exam_resu_id = ?`,
          [status === 'ABSENT' ? 0 : marksObtained, status, resultId],
          (updateError, result) => {
            if (updateError) {
              return sendDatabaseError(res, updateError);
            }

            if (!result.affectedRows) {
              return res.status(404).json({ success: false, message: 'Exam result not found' });
            }

            return res.status(200).json({
              success: true,
              message: 'Exam result updated successfully',
              status
            });
          }
        );
      });
    });
  });
}

function closeExam(req, res) {
  return ensureExamWorkflowSchema((schemaError) => {
    if (schemaError) {
      return sendDatabaseError(res, schemaError);
    }

    const examId = normalizePositiveInteger(req.params.examId);
    const clientId = normalizeOptionalPositiveInteger(req.body.clientId || req.body.client_id || req.query.client_id);
    const teacherId = normalizeOptionalPositiveInteger(getValue(req.body, 'teacherId', 'teacher_id') || req.query.teacher_id);

    if (!examId) {
      return res.status(400).json({ success: false, message: 'Valid exam id is required' });
    }

    const examSql = `
      SELECT e.exam_id, e.client_id, e.subject_id, e.exam_status, s.classroom_id
      FROM ${examsTable} e
      LEFT JOIN ${subjectsTable} s ON s.subject_id = e.subject_id
      WHERE e.exam_id = ? AND (? IS NULL OR e.client_id = ?)
    `;

    pool.query(examSql, [examId, clientId || null, clientId || null], (examError, exams) => {
      if (examError) {
        return sendDatabaseError(res, examError);
      }

      if (!exams.length) {
        return res.status(404).json({ success: false, message: 'Exam not found' });
      }

      const exam = exams[0];
      validateTeacherExamScope({ client_id: exam.client_id, subject_id: exam.subject_id }, { classroom_id: exam.classroom_id }, teacherId, (scopeError, scopeMessage) => {
        if (scopeError) {
          return sendDatabaseError(res, scopeError);
        }

        if (scopeMessage) {
          return res.status(403).json({
            success: false,
            message: 'Teacher can close only assigned exams'
          });
        }

        pool.query(
          `UPDATE ${examsTable} SET exam_status = 'CLOSED', closed_at = NOW() WHERE exam_id = ?`,
          [examId],
          (updateError, result) => {
            if (updateError) {
              return sendDatabaseError(res, updateError);
            }

            if (!result.affectedRows) {
              return res.status(404).json({ success: false, message: 'Exam not found' });
            }

            return res.status(200).json({
              success: true,
              message: 'Exam closed successfully'
            });
          }
        );
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
  updateExamResult,
  closeExam,
  deleteExamResult
};
