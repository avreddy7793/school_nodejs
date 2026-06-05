const https = require('https');
const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || process.env.DB_DATABASE || 'school';
const db = pool.promise();

const examsTable = table('exams');
const subjectsTable = table('subjects');
const classroomsTable = table('classrooms');
const studentsTable = table('students');
const resultsTable = table('exam_results');
const settingsTable = table('online_exam_settings');
const questionsTable = table('online_exam_questions');
const attemptsTable = table('online_exam_attempts');
const answersTable = table('online_exam_answers');

let schemaReady = false;

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

function normalizeNonNegativeInteger(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function normalizeString(value, fallback = null) {
  if (value === undefined || value === null) {
    return fallback;
  }

  const trimmed = String(value).trim();
  return trimmed || fallback;
}

function normalizeQuestionType(value) {
  const type = String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  return ['MCQ', 'TRUE_FALSE', 'SHORT', 'LONG'].includes(type) ? type : 'MCQ';
}

function normalizePublishStatus(value) {
  const status = String(value || '').trim().toUpperCase();
  return ['DRAFT', 'PUBLISHED', 'CLOSED'].includes(status) ? status : 'DRAFT';
}

function normalizeDifficulty(value) {
  const difficulty = String(value || '').trim().toUpperCase();
  return ['EASY', 'MEDIUM', 'HARD'].includes(difficulty) ? difficulty : 'MEDIUM';
}

function normalizeDateTime(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return String(value).slice(0, 19).replace('T', ' ');
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

function extractResponseText(payload) {
  if (typeof payload?.output_text === 'string') {
    return payload.output_text;
  }

  const output = Array.isArray(payload?.output) ? payload.output : [];
  return output
    .flatMap((item) => Array.isArray(item.content) ? item.content : [])
    .map((content) => content.text || '')
    .join('\n')
    .trim();
}

function parseGeneratedQuestions(text) {
  const cleaned = String(text || '')
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const jsonText = firstBrace >= 0 && lastBrace > firstBrace ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned;
  const parsed = JSON.parse(jsonText);
  return Array.isArray(parsed.questions) ? parsed.questions : [];
}

function openaiResponse(body) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error('OpenAI API key is not configured. Add OPENAI_API_KEY in school_nodejs/lot.env.local.');
    error.statusCode = 400;
    throw error;
  }

  const requestBody = JSON.stringify(body);
  const options = {
    hostname: 'api.openai.com',
    path: '/v1/responses',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestBody)
    }
  };

  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        let parsed = {};
        try {
          parsed = data ? JSON.parse(data) : {};
        } catch (parseError) {
          return reject(parseError);
        }

        if (response.statusCode < 200 || response.statusCode >= 300) {
          const error = new Error(parsed.error?.message || 'OpenAI request failed');
          error.statusCode = response.statusCode;
          return reject(error);
        }

        return resolve(parsed);
      });
    });

    request.on('error', reject);
    request.write(requestBody);
    request.end();
  });
}

async function ensureSchema() {
  if (schemaReady) {
    return;
  }

  schemaReady = true;
}

function examSelectSql() {
  return `
    SELECT
      e.exam_id,
      e.client_id,
      e.subject_id,
      e.exam_type,
      e.exam_date,
      e.total_marks,
      e.passing_marks,
      e.duration,
      COALESCE(e.exam_status, 'OPEN') AS exam_status,
      s.classroom_id,
      s.sub_name AS subject_name,
      c.name AS classroom_name,
      oes.online_exam_id,
      COALESCE(oes.publish_status, 'DRAFT') AS publish_status,
      COALESCE(oes.is_online, 0) AS is_online,
      oes.starts_at,
      oes.ends_at,
      oes.instructions,
      COUNT(DISTINCT q.question_id) AS question_count,
      COUNT(DISTINCT a.attempt_id) AS attempt_count
    FROM ${examsTable} e
    LEFT JOIN ${subjectsTable} s ON s.subject_id = e.subject_id
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = s.classroom_id
    LEFT JOIN ${settingsTable} oes ON oes.exam_id = e.exam_id
    LEFT JOIN ${questionsTable} q ON q.exam_id = e.exam_id AND q.status = 'ACTIVE'
    LEFT JOIN ${attemptsTable} a ON a.exam_id = e.exam_id AND a.status IN ('SUBMITTED', 'EVALUATED')
  `;
}

async function listOnlineExams(req, res) {
  try {
    await ensureSchema();
    const conditions = [];
    const values = [];

    if (req.query.client_id) {
      conditions.push('e.client_id = ?');
      values.push(req.query.client_id);
    }

    if (req.query.exam_id) {
      conditions.push('e.exam_id = ?');
      values.push(req.query.exam_id);
    }

    if (req.query.scheduled === 'true') {
      conditions.push('e.exam_date >= CURDATE()');
      conditions.push("(e.exam_status IS NULL OR e.exam_status = 'OPEN')");
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await db.query(`
      ${examSelectSql()}
      ${where}
      GROUP BY e.exam_id, oes.online_exam_id
      ORDER BY e.exam_date DESC, e.exam_id DESC
    `, values);

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function getQuestions(req, res) {
  try {
    await ensureSchema();
    const examId = normalizePositiveInteger(req.params.examId);
    if (!examId) {
      return res.status(400).json({ success: false, message: 'Exam id is required' });
    }

    const [rows] = await db.query(`
      SELECT question_id, client_id, exam_id, question_type, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, sort_order, status
      FROM ${questionsTable}
      WHERE exam_id = ?
      ORDER BY sort_order ASC, question_id ASC
    `, [examId]);

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function saveQuestions(req, res) {
  try {
    await ensureSchema();
    const examId = normalizePositiveInteger(req.params.examId);
    const clientId = normalizePositiveInteger(req.body.clientId || req.body.client_id);
    const questions = Array.isArray(req.body.questions) ? req.body.questions : [];

    if (!examId || !clientId || !questions.length) {
      return res.status(400).json({ success: false, message: 'Client, exam, and questions are required' });
    }

    await db.query(`DELETE FROM ${questionsTable} WHERE exam_id = ?`, [examId]);

    const values = questions
      .map((question, index) => ({
        client_id: clientId,
        exam_id: examId,
        question_type: normalizeQuestionType(question.questionType || question.question_type),
        question_text: normalizeString(question.questionText || question.question_text),
        option_a: normalizeString(question.optionA || question.option_a),
        option_b: normalizeString(question.optionB || question.option_b),
        option_c: normalizeString(question.optionC || question.option_c),
        option_d: normalizeString(question.optionD || question.option_d),
        correct_answer: normalizeString(question.correctAnswer || question.correct_answer),
        marks: normalizeNonNegativeInteger(question.marks, 1) || 1,
        sort_order: normalizeNonNegativeInteger(question.sortOrder || question.sort_order, index + 1) || index + 1,
        status: 'ACTIVE'
      }))
      .filter((question) => question.question_text);

    if (!values.length) {
      return res.status(400).json({ success: false, message: 'At least one question text is required' });
    }

    await db.query(`INSERT INTO ${questionsTable} SET ?`, values[0]);
    for (let index = 1; index < values.length; index += 1) {
      await db.query(`INSERT INTO ${questionsTable} SET ?`, values[index]);
    }

    return res.status(200).json({ success: true, message: 'Online exam questions saved successfully' });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function generateQuestions(req, res) {
  try {
    await ensureSchema();
    const examId = normalizePositiveInteger(req.params.examId);
    const clientId = normalizePositiveInteger(req.body.clientId || req.body.client_id || req.query.client_id);
    const count = Math.min(Math.max(normalizeNonNegativeInteger(req.body.count, 5), 1), 25);
    const questionType = normalizeQuestionType(req.body.questionType || req.body.question_type);
    const difficulty = normalizeDifficulty(req.body.difficulty);
    const topic = normalizeString(req.body.topic, 'Full syllabus');
    const marks = Math.max(normalizeNonNegativeInteger(req.body.marks, 1), 1);

    if (!examId || !clientId) {
      return res.status(400).json({ success: false, message: 'Client and exam are required for AI question generation' });
    }

    const [examRows] = await db.query(`
      ${examSelectSql()}
      WHERE e.exam_id = ? AND e.client_id = ?
      GROUP BY e.exam_id, oes.online_exam_id
      LIMIT 1
    `, [examId, clientId]);

    if (!examRows.length) {
      return res.status(404).json({ success: false, message: 'Exam not found for AI question generation' });
    }

    const exam = examRows[0];
    const prompt = `
Create ${count} school exam questions as valid JSON only.

Exam context:
- Class: ${exam.classroom_name || 'Class'}
- Subject: ${exam.subject_name || 'Subject'}
- Exam type: ${exam.exam_type || 'Exam'}
- Topic/unit: ${topic}
- Difficulty: ${difficulty}
- Question type: ${questionType}
- Marks per question: ${marks}
- Total exam marks: ${exam.total_marks || '-'}
- Duration minutes: ${exam.duration || '-'}

Return exactly this JSON shape:
{
  "questions": [
    {
      "questionType": "MCQ",
      "questionText": "Question text",
      "optionA": "Only for MCQ",
      "optionB": "Only for MCQ",
      "optionC": "Only for MCQ",
      "optionD": "Only for MCQ",
      "correctAnswer": "A",
      "marks": 1
    }
  ]
}

Rules:
- Use the requested questionType for every question.
- For MCQ, provide four meaningful options and correctAnswer must be A, B, C, or D.
- For TRUE_FALSE, correctAnswer must be true or false and options must be empty.
- For SHORT or LONG, leave options and correctAnswer empty.
- Keep language clear for the class level.
- Do not include markdown or extra text.
`;

    const aiPayload = await openaiResponse({
      model: process.env.OPENAI_MODEL || 'gpt-4.1',
      input: [
        {
          role: 'system',
          content: 'You are an expert school teacher creating accurate, age-appropriate exam questions. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4
    });

    const generated = parseGeneratedQuestions(extractResponseText(aiPayload))
      .map((question, index) => ({
        questionType: normalizeQuestionType(question.questionType || question.question_type || questionType),
        questionText: normalizeString(question.questionText || question.question_text, ''),
        optionA: normalizeString(question.optionA || question.option_a, ''),
        optionB: normalizeString(question.optionB || question.option_b, ''),
        optionC: normalizeString(question.optionC || question.option_c, ''),
        optionD: normalizeString(question.optionD || question.option_d, ''),
        correctAnswer: normalizeString(question.correctAnswer || question.correct_answer, ''),
        marks: Math.max(normalizeNonNegativeInteger(question.marks, marks), 1),
        sortOrder: index + 1
      }))
      .filter((question) => question.questionText);

    if (!generated.length) {
      return res.status(502).json({ success: false, message: 'AI did not return usable questions. Please try again.' });
    }

    return res.status(200).json({
      success: true,
      message: `${generated.length} AI question${generated.length === 1 ? '' : 's'} generated. Review before saving.`,
      data: generated
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }

    return res.status(500).json({
      success: false,
      message: 'Unable to generate AI questions',
      error: error.message
    });
  }
}

async function updateSettings(req, res) {
  try {
    await ensureSchema();
    const examId = normalizePositiveInteger(req.params.examId);
    const clientId = normalizePositiveInteger(req.body.clientId || req.body.client_id);
    if (!examId || !clientId) {
      return res.status(400).json({ success: false, message: 'Client and exam are required' });
    }

    const payload = {
      client_id: clientId,
      exam_id: examId,
      is_online: 1,
      publish_status: normalizePublishStatus(req.body.publishStatus || req.body.publish_status),
      starts_at: normalizeDateTime(req.body.startsAt || req.body.starts_at),
      ends_at: normalizeDateTime(req.body.endsAt || req.body.ends_at),
      instructions: normalizeString(req.body.instructions),
      created_by: normalizePositiveInteger(req.body.createdBy || req.body.created_by)
    };

    await db.query(`
      INSERT INTO ${settingsTable} SET ?
      ON DUPLICATE KEY UPDATE
        is_online = VALUES(is_online),
        publish_status = VALUES(publish_status),
        starts_at = VALUES(starts_at),
        ends_at = VALUES(ends_at),
        instructions = VALUES(instructions),
        updated_at = CURRENT_TIMESTAMP
    `, [payload]);

    let finalizedCount = 0;
    if (payload.publish_status === 'CLOSED') {
      finalizedCount = await finalizeExamResults(clientId, examId);
    }

    return res.status(200).json({
      success: true,
      message: payload.publish_status === 'CLOSED'
        ? `Online exam finished successfully. ${finalizedCount} student result${finalizedCount === 1 ? '' : 's'} published.`
        : 'Online exam settings saved successfully'
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function finalizeExamResults(clientId, examId) {
  const [attempts] = await db.query(`
    SELECT
      a.student_id,
      COALESCE(a.total_marks, COALESCE(a.auto_marks, 0) + COALESCE(a.manual_marks, 0)) AS marks_obtained,
      e.passing_marks
    FROM ${attemptsTable} a
    INNER JOIN ${examsTable} e ON e.exam_id = a.exam_id
    WHERE a.client_id = ?
      AND a.exam_id = ?
      AND a.status IN ('SUBMITTED', 'EVALUATED')
  `, [clientId, examId]);

  for (const attempt of attempts) {
    const marks = normalizeNonNegativeInteger(attempt.marks_obtained, 0);
    const status = marks >= normalizeNonNegativeInteger(attempt.passing_marks, 0) ? 'PASS' : 'FAIL';
    const [existing] = await db.query(`
      SELECT exam_resu_id
      FROM ${resultsTable}
      WHERE client_id = ? AND exam_id = ? AND student_id = ?
      LIMIT 1
    `, [clientId, examId, attempt.student_id]);

    if (existing.length) {
      await db.query(`
        UPDATE ${resultsTable}
        SET marks_obtained = ?, status = ?, created_at = CURRENT_TIMESTAMP
        WHERE exam_resu_id = ?
      `, [marks, status, existing[0].exam_resu_id]);
    } else {
      await db.query(`
        INSERT INTO ${resultsTable} (client_id, exam_id, student_id, marks_obtained, status)
        VALUES (?, ?, ?, ?, ?)
      `, [clientId, examId, attempt.student_id, marks, status]);
    }
  }

  return attempts.length;
}

async function getAvailableExams(req, res) {
  try {
    await ensureSchema();
    const clientId = normalizePositiveInteger(req.query.client_id);
    const studentId = normalizePositiveInteger(req.query.student_id);
    if (!clientId || !studentId) {
      return res.status(400).json({ success: false, message: 'Client and student are required' });
    }

    const [students] = await db.query(`
      SELECT student_id, class_name, classroom_id
      FROM ${studentsTable}
      WHERE student_id = ? AND client_id = ?
      LIMIT 1
    `, [studentId, clientId]);

    if (!students.length) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const classroomId = students[0].classroom_id || students[0].class_name;
    const [rows] = await db.query(`
      ${examSelectSql()}
      LEFT JOIN ${attemptsTable} own_attempt ON own_attempt.exam_id = e.exam_id AND own_attempt.student_id = ?
      WHERE e.client_id = ?
        AND s.classroom_id = ?
        AND oes.is_online = 1
        AND oes.publish_status = 'PUBLISHED'
        AND (oes.starts_at IS NULL OR oes.starts_at <= NOW())
        AND (oes.ends_at IS NULL OR oes.ends_at >= NOW())
      GROUP BY e.exam_id, oes.online_exam_id, own_attempt.attempt_id
      ORDER BY e.exam_date ASC, e.exam_id ASC
    `, [studentId, clientId, classroomId]);

    return res.status(200).json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        attempt_status: row.attempt_id ? row.status : null
      }))
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function getAttempt(req, res) {
  try {
    await ensureSchema();
    const examId = normalizePositiveInteger(req.params.examId);
    const studentId = normalizePositiveInteger(req.query.student_id);

    if (!examId || !studentId) {
      return res.status(400).json({ success: false, message: 'Exam and student are required' });
    }

    const [examRows] = await db.query(`
      ${examSelectSql()}
      WHERE e.exam_id = ? AND oes.is_online = 1
      GROUP BY e.exam_id, oes.online_exam_id
      LIMIT 1
    `, [examId]);

    if (!examRows.length) {
      return res.status(404).json({ success: false, message: 'Online exam not found' });
    }

    const accessMessage = onlineExamAccessMessage(examRows[0]);

    const [questions] = await db.query(`
      SELECT question_id, question_type, question_text, option_a, option_b, option_c, option_d, marks, sort_order
      FROM ${questionsTable}
      WHERE exam_id = ? AND status = 'ACTIVE'
      ORDER BY sort_order ASC, question_id ASC
    `, [examId]);

    const [attempts] = await db.query(`
      SELECT attempt_id, status, started_at, submitted_at, total_marks
      FROM ${attemptsTable}
      WHERE exam_id = ? AND student_id = ?
      LIMIT 1
    `, [examId, studentId]);

    return res.status(200).json({
      success: true,
      data: {
        exam: examRows[0],
        questions,
        attempt: attempts[0] || null,
        access_message: accessMessage
      }
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

function isAutoQuestion(question) {
  return question.question_type === 'MCQ' || question.question_type === 'TRUE_FALSE';
}

function compareAnswer(expected, actual) {
  return String(expected || '').trim().toLowerCase() === String(actual || '').trim().toLowerCase();
}

function onlineExamAccessMessage(exam) {
  const status = String(exam?.publish_status || '').toUpperCase();
  const now = Date.now();
  const startsAt = exam?.starts_at ? new Date(exam.starts_at).getTime() : null;
  const endsAt = exam?.ends_at ? new Date(exam.ends_at).getTime() : null;

  if (status !== 'PUBLISHED') {
    return status === 'CLOSED' ? 'This online exam is closed.' : 'This online exam has not started yet.';
  }

  if (startsAt && now < startsAt) {
    return 'This online exam has not started yet.';
  }

  if (endsAt && now > endsAt) {
    return 'This online exam time is completed.';
  }

  return '';
}

async function submitAttempt(req, res) {
  try {
    await ensureSchema();
    const examId = normalizePositiveInteger(req.params.examId);
    const clientId = normalizePositiveInteger(req.body.clientId || req.body.client_id);
    const studentId = normalizePositiveInteger(req.body.studentId || req.body.student_id);
    const submittedAnswers = Array.isArray(req.body.answers) ? req.body.answers : [];

    if (!examId || !clientId || !studentId || !submittedAnswers.length) {
      return res.status(400).json({ success: false, message: 'Client, exam, student, and answers are required' });
    }

    const [examRows] = await db.query(`
      ${examSelectSql()}
      WHERE e.exam_id = ? AND oes.is_online = 1
      GROUP BY e.exam_id, oes.online_exam_id
      LIMIT 1
    `, [examId]);

    if (!examRows.length) {
      return res.status(404).json({ success: false, message: 'Online exam not found' });
    }

    const [existingAttempts] = await db.query(`
      SELECT attempt_id, status
      FROM ${attemptsTable}
      WHERE exam_id = ? AND student_id = ?
      LIMIT 1
    `, [examId, studentId]);

    if (existingAttempts.length && existingAttempts[0].status !== 'STARTED') {
      return res.status(409).json({ success: false, message: 'This online exam is already submitted.' });
    }

    const accessMessage = onlineExamAccessMessage(examRows[0]);
    if (accessMessage) {
      return res.status(403).json({ success: false, message: accessMessage });
    }

    let attemptId = existingAttempts[0]?.attempt_id;
    if (!attemptId) {
      const [attemptResult] = await db.query(`INSERT INTO ${attemptsTable} SET ?`, [{
        client_id: clientId,
        exam_id: examId,
        student_id: studentId,
        status: 'STARTED'
      }]);
      attemptId = attemptResult.insertId;
    }

    const [questions] = await db.query(`
      SELECT question_id, question_type, correct_answer, marks
      FROM ${questionsTable}
      WHERE exam_id = ? AND status = 'ACTIVE'
    `, [examId]);
    const questionMap = new Map(questions.map((question) => [Number(question.question_id), question]));

    let autoMarks = 0;
    let hasManualQuestions = false;

    await db.query(`DELETE FROM ${answersTable} WHERE attempt_id = ?`, [attemptId]);

    for (const answer of submittedAnswers) {
      const questionId = normalizePositiveInteger(answer.questionId || answer.question_id);
      const question = questionMap.get(questionId);
      if (!question) {
        continue;
      }

      const answerText = normalizeString(answer.answerText || answer.answer_text, '');
      const isAuto = isAutoQuestion(question);
      const isCorrect = isAuto ? compareAnswer(question.correct_answer, answerText) : null;
      const answerMarks = isCorrect ? normalizeNonNegativeInteger(question.marks, 0) : 0;
      if (isAuto) {
        autoMarks += answerMarks;
      } else {
        hasManualQuestions = true;
      }

      await db.query(`INSERT INTO ${answersTable} SET ?`, [{
        client_id: clientId,
        attempt_id: attemptId,
        exam_id: examId,
        question_id: questionId,
        student_id: studentId,
        answer_text: answerText,
        is_correct: isCorrect,
        auto_marks: answerMarks
      }]);
    }

    const status = hasManualQuestions ? 'SUBMITTED' : 'EVALUATED';
    await db.query(`
      UPDATE ${attemptsTable}
      SET submitted_at = NOW(), status = ?, auto_marks = ?, total_marks = ?
      WHERE attempt_id = ?
    `, [status, autoMarks, autoMarks, attemptId]);

    if (!hasManualQuestions) {
      const resultStatus = autoMarks >= normalizeNonNegativeInteger(examRows[0].passing_marks, 0) ? 'PASS' : 'FAIL';
      await db.query(`
        INSERT INTO ${resultsTable} (client_id, exam_id, student_id, marks_obtained, status)
        VALUES (?, ?, ?, ?, ?)
      `, [clientId, examId, studentId, autoMarks, resultStatus]);
    }

    return res.status(200).json({
      success: true,
      message: hasManualQuestions ? 'Exam submitted. Teacher review is pending.' : 'Exam submitted and result generated.',
      data: { attempt_id: attemptId, auto_marks: autoMarks, status }
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function getSummary(req, res) {
  try {
    await ensureSchema();
    const examId = normalizePositiveInteger(req.params.examId);
    if (!examId) {
      return res.status(400).json({ success: false, message: 'Exam id is required' });
    }

    const [rows] = await db.query(`
      SELECT
        a.attempt_id,
        a.student_id,
        CONCAT_WS(' ', s.first_name, s.middle_name, s.last_name) AS student_name,
        s.admission_number,
        a.status,
        a.started_at,
        a.submitted_at,
        a.auto_marks,
        a.manual_marks,
        a.total_marks,
        e.total_marks AS exam_total_marks,
        e.passing_marks,
        er.exam_resu_id,
        er.marks_obtained AS result_marks,
        er.status AS result_status
      FROM ${attemptsTable} a
      LEFT JOIN ${studentsTable} s ON s.student_id = a.student_id
      LEFT JOIN ${examsTable} e ON e.exam_id = a.exam_id
      LEFT JOIN ${resultsTable} er ON er.exam_id = a.exam_id AND er.student_id = a.student_id
      WHERE a.exam_id = ?
      ORDER BY a.submitted_at DESC, a.attempt_id DESC
    `, [examId]);

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

function answerLabel(question, value) {
  const answer = String(value || '').trim();
  if (!answer) {
    return '-';
  }

  if (question.question_type === 'MCQ') {
    const optionKey = answer.toUpperCase();
    const optionMap = {
      A: question.option_a,
      B: question.option_b,
      C: question.option_c,
      D: question.option_d
    };
    return optionMap[optionKey] ? `${optionKey} - ${optionMap[optionKey]}` : answer;
  }

  if (question.question_type === 'TRUE_FALSE') {
    return answer.toLowerCase() === 'true' ? 'True' : answer.toLowerCase() === 'false' ? 'False' : answer;
  }

  return answer;
}

async function getStudentReview(req, res) {
  try {
    await ensureSchema();
    const examId = normalizePositiveInteger(req.params.examId);
    const studentId = normalizePositiveInteger(req.query.student_id);
    if (!examId || !studentId) {
      return res.status(400).json({ success: false, message: 'Exam and student are required' });
    }

    const [rows] = await db.query(`
      SELECT
        q.question_id,
        q.question_type,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer,
        q.marks,
        q.sort_order,
        ans.answer_text,
        ans.is_correct,
        ans.auto_marks,
        ans.manual_marks,
        ans.teacher_feedback,
        a.status AS attempt_status,
        a.submitted_at
      FROM ${attemptsTable} a
      INNER JOIN ${questionsTable} q ON q.exam_id = a.exam_id AND q.status = 'ACTIVE'
      LEFT JOIN ${answersTable} ans ON ans.attempt_id = a.attempt_id AND ans.question_id = q.question_id
      WHERE a.exam_id = ?
        AND a.student_id = ?
        AND a.status IN ('SUBMITTED', 'EVALUATED')
      ORDER BY q.sort_order ASC, q.question_id ASC
    `, [examId, studentId]);

    return res.status(200).json({
      success: true,
      data: rows.map((row) => ({
        ...row,
        student_answer_label: answerLabel(row, row.answer_text),
        correct_answer_label: answerLabel(row, row.correct_answer)
      }))
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

module.exports = {
  listOnlineExams,
  getQuestions,
  saveQuestions,
  generateQuestions,
  updateSettings,
  getAvailableExams,
  getAttempt,
  submitAttempt,
  getSummary,
  getStudentReview
};
