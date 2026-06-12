const crypto = require('crypto');
const { pool } = require('../config');
const { deleteHostedFile, isHostedUrl } = require('./hostinger-storage');
const { buildStudentAdmissionNumber } = require('./admission-number');
const { classroomOrderSql } = require('./classroom-order');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';
const clientMasterTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('client_master')}`;
const schoolSettingsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('school_settings')}`;
const studentsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('students')}`;
const classroomsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('classrooms')}`;
const sectionsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('sections')}`;
const feesTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('fee_records')}`;
const academicYearPromotionsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('student_academic_year_promotions')}`;
const loginTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('login')}`;

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

function normalizeText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed || null;
}

function normalizeMoney(value, fallback = null) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Number(parsed.toFixed(2)) : null;
}

function getValue(body, camelKey, snakeKey = camelKey) {
  if (body[camelKey] !== undefined) {
    return body[camelKey];
  }

  return body[snakeKey];
}

function hashPassword(password) {
  const salt = crypto.randomBytes(Math.ceil(15 / 2)).toString('hex').slice(0, 15);
  const hash = crypto.createHmac('sha512', salt);
  hash.update(password);

  return {
    salt,
    passkey: hash.digest('hex')
  };
}

function passwordMatches(password, salt, passkey) {
  if (!password || !salt || !passkey) {
    return false;
  }

  const hash = crypto.createHmac('sha512', salt);
  hash.update(password);
  return hash.digest('hex') === passkey;
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : String(value).slice(0, 10);
}

function academicYearParts(value) {
  const text = normalizeText(value);
  if (!text) {
    return null;
  }

  const matches = text.match(/\d{2,4}/g);
  if (!matches?.length || matches[0].length !== 4) {
    return null;
  }

  const startYear = Number(matches[0]);
  let endYear = matches[1]
    ? Number(matches[1].length === 2 ? `${String(startYear).slice(0, 2)}${matches[1]}` : matches[1])
    : startYear + 1;

  if (endYear < startYear) {
    endYear += 100;
  }

  if (!Number.isInteger(startYear) || !Number.isInteger(endYear) || endYear <= startYear) {
    return null;
  }

  return { startYear, endYear };
}

function formatAcademicYear(startYear, endYear) {
  return `${startYear}-${String(endYear).slice(-2)}`;
}

function normalizeAcademicYear(value) {
  const text = normalizeText(value);
  if (!text) {
    return null;
  }

  const parts = academicYearParts(text);
  return parts ? formatAcademicYear(parts.startYear, parts.endYear) : text;
}

function academicYearAliases(value) {
  const text = normalizeText(value);
  if (!text) {
    return [];
  }

  const parts = academicYearParts(text);
  const aliases = new Set([text, normalizeAcademicYear(text)]);
  if (parts) {
    aliases.add(formatAcademicYear(parts.startYear, parts.endYear));
    aliases.add(`${parts.startYear}-${parts.endYear}`);
  }

  return Array.from(aliases).filter(Boolean);
}

function feeYearAliases(value) {
  const aliases = new Set(academicYearAliases(value));
  const parts = academicYearParts(value);
  if (parts) {
    aliases.add(String(parts.startYear));
  }

  return Array.from(aliases).filter(Boolean);
}

function defaultAcademicYear(today = new Date()) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const startYear = month >= 5 ? year : year - 1;
  return formatAcademicYear(startYear, startYear + 1);
}

function defaultAcademicStart(today = new Date()) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const startYear = month >= 5 ? year : year - 1;
  return `${startYear}-06-01`;
}

function defaultAcademicEnd(today = new Date()) {
  const year = today.getFullYear();
  const month = today.getMonth();
  const startYear = month >= 5 ? year : year - 1;
  return `${startYear + 1}-05-31`;
}

async function ensureBrandingSchema() {
  const [columns] = await pool.promise().query(`SHOW COLUMNS FROM ${clientMasterTable} LIKE 'img'`);
  const imgColumn = columns[0];

  if (imgColumn && !String(imgColumn.Type || '').toLowerCase().includes('text')) {
    await pool.promise().query(`ALTER TABLE ${clientMasterTable} MODIFY COLUMN img MEDIUMTEXT NULL`);
  }
}

async function ensureSettingsSchema() {
  await pool.promise().query(`
    CREATE TABLE IF NOT EXISTS ${schoolSettingsTable} (
      setting_id int NOT NULL AUTO_INCREMENT,
      client_id bigint NOT NULL,
      current_academic_year varchar(20) DEFAULT NULL,
      academic_year_start_date date DEFAULT NULL,
      academic_year_end_date date DEFAULT NULL,
      created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (setting_id),
      UNIQUE KEY uq_school_settings_client_year (client_id, current_academic_year),
      KEY idx_school_settings_year (current_academic_year)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  const [oldClientIndex] = await pool.promise().query(`SHOW INDEX FROM ${schoolSettingsTable} WHERE Key_name = 'uq_school_settings_client'`);
  if (oldClientIndex.length) {
    await pool.promise().query(`ALTER TABLE ${schoolSettingsTable} DROP INDEX uq_school_settings_client`);
  }

  const [clientYearIndex] = await pool.promise().query(`SHOW INDEX FROM ${schoolSettingsTable} WHERE Key_name = 'uq_school_settings_client_year'`);
  if (!clientYearIndex.length) {
    await pool.promise().query(`
      ALTER TABLE ${schoolSettingsTable}
      ADD UNIQUE KEY uq_school_settings_client_year (client_id, current_academic_year)
    `);
  }

  await pool.promise().query(`
    CREATE TABLE IF NOT EXISTS ${academicYearPromotionsTable} (
      promotion_id bigint NOT NULL AUTO_INCREMENT,
      batch_id varchar(64) NOT NULL,
      client_id bigint NOT NULL,
      student_id int NOT NULL,
      from_academic_year varchar(20) NOT NULL,
      to_academic_year varchar(20) NOT NULL,
      from_classroom_id int DEFAULT NULL,
      from_classroom_name varchar(100) DEFAULT NULL,
      to_classroom_id int DEFAULT NULL,
      to_classroom_name varchar(100) DEFAULT NULL,
      from_section varchar(20) DEFAULT NULL,
      to_section varchar(20) DEFAULT NULL,
      from_roll_number int DEFAULT NULL,
      to_roll_number int DEFAULT NULL,
      from_enrollment_status varchar(20) DEFAULT NULL,
      to_enrollment_status varchar(20) DEFAULT NULL,
      action varchar(20) NOT NULL,
      created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (promotion_id),
      KEY idx_student_year_promotions_batch (batch_id),
      KEY idx_student_year_promotions_client_year (client_id, from_academic_year, to_academic_year),
      KEY idx_student_year_promotions_student (student_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
}

async function ensureFeeRecordSchema() {
  const [columns] = await pool.promise().query(`SHOW COLUMNS FROM ${feesTable} LIKE 'hostel_fee'`);
  if (!columns.length) {
    await pool.promise().query(`ALTER TABLE ${feesTable} ADD COLUMN hostel_fee DECIMAL(10,2) DEFAULT NULL AFTER transport`);
  }
}

function classroomSortRank(name) {
  const normalized = String(name || '').trim().toUpperCase();
  if (!normalized) {
    return 9999;
  }

  if (normalized.includes('NURSERY') || normalized.includes('NURSARY')) {
    return -3;
  }

  if (normalized.includes('LKG')) {
    return -2;
  }

  if (normalized.includes('UKG')) {
    return -1;
  }

  const numberMatch = normalized.match(/\d+/);
  return numberMatch ? Number(numberMatch[0]) : 9999;
}

function compareClassrooms(first, second) {
  const firstRank = classroomSortRank(first.name);
  const secondRank = classroomSortRank(second.name);
  if (firstRank !== secondRank) {
    return firstRank - secondRank;
  }

  return String(first.name || '').localeCompare(String(second.name || ''), undefined, {
    numeric: true,
    sensitivity: 'base'
  });
}

function studentDisplayName(student) {
  return [student.first_name, student.middle_name, student.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
}

function chooseTargetSection(targetSections, currentSection) {
  if (!targetSections.length) {
    return null;
  }

  const normalizedSection = String(currentSection || '').trim().toLowerCase();
  const matchingSection = targetSections.find((section) =>
    String(section.section_name || '').trim().toLowerCase() === normalizedSection
  );

  return matchingSection?.section_name || targetSections[0].section_name;
}

function promotionClassKey(item) {
  return [
    item.action,
    item.from_classroom_id || '',
    item.to_classroom_id || '',
    item.from_section || '',
    item.to_section || ''
  ].join('|');
}

function summarizePromotionPlan(plan) {
  const classMap = new Map();

  for (const item of plan) {
    const key = promotionClassKey(item);
    const current = classMap.get(key) || {
      action: item.action,
      from_classroom_id: item.from_classroom_id,
      from_classroom_name: item.from_classroom_name,
      to_classroom_id: item.to_classroom_id,
      to_classroom_name: item.to_classroom_name,
      from_section: item.from_section,
      to_section: item.to_section,
      reason: item.reason || null,
      student_count: 0
    };

    current.student_count += 1;
    classMap.set(key, current);
  }

  return Array.from(classMap.values()).sort((first, second) =>
    compareClassrooms(
      { name: first.from_classroom_name || '' },
      { name: second.from_classroom_name || '' }
    )
  );
}

function promotionSummary(plan) {
  return {
    total_students: plan.length,
    promotable_students: plan.filter((item) => item.action === 'PROMOTE').length,
    alumni_students: plan.filter((item) => item.action === 'ALUMNI').length,
    blocked_students: plan.filter((item) => item.action === 'BLOCKED').length
  };
}

function promotionResponseData(clientId, fromAcademicYear, toAcademicYear, plan, extra = {}) {
  const blockedStudents = plan.filter((item) => item.action === 'BLOCKED');

  return {
    client_id: clientId,
    from_academic_year: normalizeAcademicYear(fromAcademicYear),
    to_academic_year: normalizeAcademicYear(toAcademicYear),
    summary: promotionSummary(plan),
    classes: summarizePromotionPlan(plan),
    sample_students: plan.slice(0, 30),
    blocked_students: blockedStudents.slice(0, 30),
    ...extra
  };
}

async function buildAcademicYearRolloverPlan(connection, clientId, fromAcademicYear, toAcademicYear, options = {}) {
  const fromAliases = academicYearAliases(fromAcademicYear);
  const lockClause = options.lockStudents ? 'FOR UPDATE' : '';

  const [classrooms] = await connection.query(`
    SELECT classroom_id, name
    FROM ${classroomsTable}
    WHERE client_id = ?
    ORDER BY ${classroomOrderSql('name')}
  `, [clientId]);

  const orderedClassrooms = classrooms.slice().sort(compareClassrooms);
  const classroomIndex = new Map(
    orderedClassrooms.map((classroom, index) => [Number(classroom.classroom_id), index])
  );

  const [sections] = await connection.query(`
    SELECT section_id, classroom_id, section_name
    FROM ${sectionsTable}
    WHERE client_id = ?
    ORDER BY section_name ASC
  `, [clientId]);

  const sectionsByClassroom = new Map();
  for (const section of sections) {
    const key = Number(section.classroom_id);
    const list = sectionsByClassroom.get(key) || [];
    list.push(section);
    sectionsByClassroom.set(key, list);
  }

  const [students] = await connection.query(`
    SELECT
      s.student_id,
      s.admission_number,
      s.first_name,
      s.middle_name,
      s.last_name,
      s.class_name,
      c.name AS class_display_name,
      s.section,
      s.roll_number,
      s.academic_year,
      s.enrollment_status
    FROM ${studentsTable} s
    LEFT JOIN ${classroomsTable} c ON c.classroom_id = s.class_name
    WHERE s.client_id = ?
      AND s.academic_year IN (?)
      AND s.enrollment_status = 'Active'
    ORDER BY
      ${classroomOrderSql('c.name')},
      s.section,
      COALESCE(s.roll_number, 99999),
      s.first_name,
      s.last_name,
      s.student_id
    ${lockClause}
  `, [clientId, fromAliases]);

  return students.map((student) => {
    const fromClassroomId = Number(student.class_name) || null;
    const fromClassroomIndex = fromClassroomId ? classroomIndex.get(fromClassroomId) : undefined;
    const fromClassroom = fromClassroomIndex === undefined ? null : orderedClassrooms[fromClassroomIndex];
    const nextClassroom = fromClassroomIndex === undefined ? null : orderedClassrooms[fromClassroomIndex + 1] || null;
    const base = {
      student_id: student.student_id,
      admission_number: student.admission_number,
      student_name: studentDisplayName(student),
      from_classroom_id: fromClassroomId,
      from_classroom_name: student.class_display_name || fromClassroom?.name || null,
      from_section: student.section || null,
      from_roll_number: student.roll_number || null,
      from_enrollment_status: student.enrollment_status || null,
      to_classroom_id: null,
      to_classroom_name: null,
      to_section: null,
      to_roll_number: null,
      to_enrollment_status: 'Active',
      action: 'BLOCKED',
      reason: null
    };

    if (fromClassroomIndex === undefined) {
      return {
        ...base,
        reason: 'Current class is missing from class setup.'
      };
    }

    if (!nextClassroom) {
      return {
        ...base,
        to_enrollment_status: 'Alumni',
        action: 'ALUMNI',
        reason: 'Highest configured class; student will be marked Alumni.'
      };
    }

    const targetSections = sectionsByClassroom.get(Number(nextClassroom.classroom_id)) || [];
    const targetSection = chooseTargetSection(targetSections, student.section);
    if (!targetSection) {
      return {
        ...base,
        to_classroom_id: nextClassroom.classroom_id,
        to_classroom_name: nextClassroom.name,
        reason: 'Target class has no sections configured.'
      };
    }

    return {
      ...base,
      to_classroom_id: nextClassroom.classroom_id,
      to_classroom_name: nextClassroom.name,
      to_section: targetSection,
      action: 'PROMOTE',
      reason: null
    };
  });
}

function rollKey(classroomId, section) {
  return `${classroomId || ''}`;
}

async function loadRollCounters(connection, clientId, academicYear) {
  const [rows] = await connection.query(`
    SELECT class_name, section, MAX(COALESCE(roll_number, 0)) AS max_roll
    FROM ${studentsTable}
    WHERE client_id = ?
      AND academic_year IN (?)
    GROUP BY class_name
  `, [clientId, academicYearAliases(academicYear)]);

  return new Map(rows.map((row) => [
    rollKey(row.class_name, row.section),
    Number(row.max_roll || 0)
  ]));
}

function nextRollNumber(rollCounters, classroomId, section) {
  const key = rollKey(classroomId, section);
  const next = Number(rollCounters.get(key) || 0) + 1;
  rollCounters.set(key, next);
  return next;
}

function buildBatchId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
}

async function insertPromotionAudit(connection, batchId, clientId, fromAcademicYear, toAcademicYear, item) {
  await connection.query(`INSERT INTO ${academicYearPromotionsTable} SET ?`, {
    batch_id: batchId,
    client_id: clientId,
    student_id: item.student_id,
    from_academic_year: normalizeAcademicYear(fromAcademicYear),
    to_academic_year: normalizeAcademicYear(toAcademicYear),
    from_classroom_id: item.from_classroom_id,
    from_classroom_name: item.from_classroom_name,
    to_classroom_id: item.to_classroom_id,
    to_classroom_name: item.to_classroom_name,
    from_section: item.from_section,
    to_section: item.to_section,
    from_roll_number: item.from_roll_number,
    to_roll_number: item.to_roll_number,
    from_enrollment_status: item.from_enrollment_status,
    to_enrollment_status: item.to_enrollment_status,
    action: item.action
  });
}

async function saveAcademicCalendar(connection, clientId, payload) {
  await connection.query(`
    INSERT INTO ${schoolSettingsTable}
      (client_id, current_academic_year, academic_year_start_date, academic_year_end_date)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      academic_year_start_date = VALUES(academic_year_start_date),
      academic_year_end_date = VALUES(academic_year_end_date)
  `, [clientId, payload.current_academic_year, payload.academic_year_start_date, payload.academic_year_end_date]);
}

function mapBranding(row) {
  return {
    client_id: row.client_id,
    school_name: row.client_name || '',
    school_address: row.client_address || '',
    school_logo_url: row.img || '',
    owner_name: row.owner_name || '',
    phone_number: row.mobile_number || '',
    email: row.email || ''
  };
}

function selectBranding(clientId, callback) {
  const sql = `
    SELECT client_id, client_name, client_address, img, owner_name, mobile_number, email
    FROM ${clientMasterTable}
    WHERE client_id = ?
    LIMIT 1
  `;

  pool.query(sql, [clientId], callback);
}

async function deleteHostedFileQuietly(url) {
  if (!isHostedUrl(url)) {
    return;
  }

  try {
    await deleteHostedFile(url);
  } catch (error) {
    console.warn('Unable to delete hosted school image:', error.message);
  }
}

async function getSchoolBranding(req, res) {
  try {
    await ensureBrandingSchema();
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const clientId = normalizePositiveInteger(req.query.client_id || req.decoded?.client_id);
  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'Client id is required'
    });
  }

  selectBranding(clientId, (error, results) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    if (!results.length) {
      return res.status(404).json({
        success: false,
        message: 'School profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: mapBranding(results[0])
    });
  });
}

async function updateSchoolBranding(req, res) {
  try {
    await ensureBrandingSchema();

    const clientId = normalizePositiveInteger(
      getValue(req.body, 'clientId', 'client_id') ||
      req.query.client_id ||
      req.decoded?.client_id ||
      req.decoded?.clientid
    );
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client id is required'
      });
    }

    const payload = {
      client_name: normalizeText(getValue(req.body, 'schoolName', 'school_name')),
      client_address: normalizeText(getValue(req.body, 'schoolAddress', 'school_address')),
      img: normalizeText(getValue(req.body, 'schoolLogoUrl', 'school_logo_url')),
      mobile_number: normalizeText(getValue(req.body, 'phoneNumber', 'phone_number')),
      email: normalizeText(getValue(req.body, 'email'))
    };

    const database = pool.promise();
    const [existingRows] = await database.query(
      `
        SELECT client_id, client_name, client_address, img, owner_name, mobile_number, email
        FROM ${clientMasterTable}
        WHERE client_id = ?
        LIMIT 1
      `,
      [clientId]
    );

    if (!existingRows.length) {
      return res.status(404).json({
        success: false,
        message: 'School profile not found'
      });
    }

    const oldLogoUrl = existingRows[0].img || '';
    const [result] = await database.query(`UPDATE ${clientMasterTable} SET ? WHERE client_id = ?`, [payload, clientId]);
    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: 'School profile not found'
      });
    }

    const [results] = await database.query(
      `
        SELECT client_id, client_name, client_address, img, owner_name, mobile_number, email
        FROM ${clientMasterTable}
        WHERE client_id = ?
        LIMIT 1
      `,
      [clientId]
    );

    if (oldLogoUrl && oldLogoUrl !== payload.img) {
      deleteHostedFileQuietly(oldLogoUrl);
    }

    return res.status(200).json({
      success: true,
      message: 'School branding saved successfully',
      data: mapBranding(results[0])
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function getAcademicCalendar(req, res) {
  try {
    await ensureSettingsSchema();
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const clientId = normalizePositiveInteger(req.query.client_id || req.decoded?.client_id);
  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'Client id is required'
    });
  }

  pool.query(`
    SELECT *
    FROM ${schoolSettingsTable}
    WHERE client_id = ?
    ORDER BY
      CASE
        WHEN academic_year_start_date <= CURDATE() AND academic_year_end_date >= CURDATE() THEN 0
        ELSE 1
      END,
      academic_year_start_date DESC,
      updated_at DESC
    LIMIT 1
  `, [clientId], (error, rows) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    const row = rows[0] || {};
    return res.status(200).json({
      success: true,
      data: {
        client_id: clientId,
        current_academic_year: normalizeAcademicYear(row.current_academic_year) || defaultAcademicYear(),
        academic_year_start_date: row.academic_year_start_date || defaultAcademicStart(),
        academic_year_end_date: row.academic_year_end_date || defaultAcademicEnd()
      }
    });
  });
}

async function updateAcademicCalendar(req, res) {
  try {
    await ensureSettingsSchema();
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const clientId = normalizePositiveInteger(getValue(req.body, 'clientId', 'client_id') || req.query.client_id || req.decoded?.client_id);
  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'Client id is required'
    });
  }

  const payload = {
    current_academic_year: normalizeAcademicYear(getValue(req.body, 'currentAcademicYear', 'current_academic_year')) || defaultAcademicYear(),
    academic_year_start_date: normalizeDate(getValue(req.body, 'academicYearStartDate', 'academic_year_start_date')),
    academic_year_end_date: normalizeDate(getValue(req.body, 'academicYearEndDate', 'academic_year_end_date'))
  };

  if (!payload.academic_year_start_date || !payload.academic_year_end_date) {
    return res.status(400).json({
      success: false,
      message: 'Academic start and end dates are required'
    });
  }

  if (payload.academic_year_end_date < payload.academic_year_start_date) {
    return res.status(400).json({
      success: false,
      message: 'Academic end date cannot be before start date'
    });
  }

  pool.query(`
    INSERT INTO ${schoolSettingsTable}
      (client_id, current_academic_year, academic_year_start_date, academic_year_end_date)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      academic_year_start_date = VALUES(academic_year_start_date),
      academic_year_end_date = VALUES(academic_year_end_date)
  `, [clientId, payload.current_academic_year, payload.academic_year_start_date, payload.academic_year_end_date], (error) => {
    if (error) {
      return sendDatabaseError(res, error);
    }

    return res.status(200).json({
      success: true,
      message: 'Academic calendar saved successfully',
      data: {
        client_id: clientId,
        ...payload
      }
    });
  });
}

async function getClassFeeSetup(req, res) {
  const clientId = normalizePositiveInteger(req.query.client_id || req.query.clientId || req.decoded?.client_id);
  const academicYear = normalizeAcademicYear(req.query.academic_year || req.query.academicYear) || defaultAcademicYear();

  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'Client id is required'
    });
  }

  try {
    const [rows] = await pool.promise().query(`
      SELECT
        c.classroom_id,
        c.name,
        COUNT(s.student_id) AS student_count,
        COALESCE(MIN(CAST(COALESCE(s.yearly_fee, 0) AS DECIMAL(10,2))), 0) AS min_fee,
        COALESCE(MAX(CAST(COALESCE(s.yearly_fee, 0) AS DECIMAL(10,2))), 0) AS max_fee
      FROM ${classroomsTable} c
      LEFT JOIN ${studentsTable} s
        ON s.class_name = c.classroom_id
        AND s.client_id = c.client_id
        AND s.academic_year IN (?)
        AND s.enrollment_status = 'Active'
      WHERE c.client_id = ?
      GROUP BY c.classroom_id, c.name
    `, [academicYearAliases(academicYear), clientId]);

    const classes = rows
      .map((row) => {
        const minFee = Number(row.min_fee || 0);
        const maxFee = Number(row.max_fee || 0);
        return {
          classroom_id: row.classroom_id,
          name: row.name,
          student_count: Number(row.student_count || 0),
          min_fee: minFee,
          max_fee: maxFee,
          yearly_fee: minFee === maxFee ? maxFee : maxFee
        };
      })
      .sort(compareClassrooms);

    return res.status(200).json({
      success: true,
      data: {
        client_id: clientId,
        academic_year: normalizeAcademicYear(academicYear),
        classes
      }
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function updateClassFeeSetup(req, res) {
  const clientId = normalizePositiveInteger(getValue(req.body, 'clientId', 'client_id') || req.query.client_id || req.decoded?.client_id);
  const academicYear = normalizeAcademicYear(getValue(req.body, 'academicYear', 'academic_year')) || defaultAcademicYear();
  const feeItems = Array.isArray(req.body?.fees) ? req.body.fees : [];

  if (!clientId || !academicYear) {
    return res.status(400).json({
      success: false,
      message: 'Client and academic year are required'
    });
  }

  const normalizedFees = feeItems
    .map((item) => ({
      classroom_id: normalizePositiveInteger(getValue(item, 'classroomId', 'classroom_id')),
      yearly_fee: normalizeMoney(getValue(item, 'yearlyFee', 'yearly_fee'))
    }))
    .filter((item) => item.classroom_id || item.yearly_fee !== null);

  if (!normalizedFees.length) {
    return res.status(400).json({
      success: false,
      message: 'Enter at least one class fee'
    });
  }

  if (normalizedFees.some((item) => !item.classroom_id || item.yearly_fee === null)) {
    return res.status(400).json({
      success: false,
      message: 'Each class fee must include a class and a valid amount'
    });
  }

  const connection = await pool.promise().getConnection();
  const academicYearValues = academicYearAliases(academicYear);
  const feeYearValues = feeYearAliases(academicYear);

  try {
    await ensureFeeRecordSchema();
    await connection.beginTransaction();

    const summary = [];
    for (const item of normalizedFees) {
      const [classRows] = await connection.query(`
        SELECT classroom_id, name
        FROM ${classroomsTable}
        WHERE classroom_id = ?
          AND client_id = ?
        LIMIT 1
      `, [item.classroom_id, clientId]);

      if (!classRows.length) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: `Class ${item.classroom_id} was not found for this client`
        });
      }

      const [studentsResult] = await connection.query(`
        UPDATE ${studentsTable}
        SET yearly_fee = ?
        WHERE client_id = ?
          AND class_name = ?
          AND academic_year IN (?)
          AND enrollment_status = 'Active'
      `, [item.yearly_fee, clientId, item.classroom_id, academicYearValues]);

      const [feeRecordsResult] = await connection.query(`
        UPDATE ${feesTable} fr
        INNER JOIN ${studentsTable} s
          ON s.student_id = fr.student_id
          AND s.client_id = fr.client_id
        SET
          fr.monthly_fee = ?,
          fr.total = GREATEST(
            ? +
            COALESCE(fr.admission_fee, 0) +
            COALESCE(fr.registration_fee, 0) +
            COALESCE(fr.art_material, 0) +
            COALESCE(fr.transport, 0) +
            COALESCE(fr.hostel_fee, 0) +
            COALESCE(fr.books, 0) +
            COALESCE(fr.uniform, 0) +
            COALESCE(fr.fine, 0) +
            COALESCE(fr.others, 0) +
            COALESCE(fr.previous_balance, 0) -
            COALESCE(fr.discount, 0),
            0
          ),
          fr.due_balance = GREATEST(
            GREATEST(
              ? +
              COALESCE(fr.admission_fee, 0) +
              COALESCE(fr.registration_fee, 0) +
              COALESCE(fr.art_material, 0) +
              COALESCE(fr.transport, 0) +
              COALESCE(fr.hostel_fee, 0) +
              COALESCE(fr.books, 0) +
              COALESCE(fr.uniform, 0) +
              COALESCE(fr.fine, 0) +
              COALESCE(fr.others, 0) +
              COALESCE(fr.previous_balance, 0) -
              COALESCE(fr.discount, 0),
              0
            ) - COALESCE(fr.deposit, 0),
            0
          )
        WHERE fr.client_id = ?
          AND s.class_name = ?
          AND s.academic_year IN (?)
          AND fr.fee_year IN (?)
      `, [
        item.yearly_fee,
        item.yearly_fee,
        item.yearly_fee,
        clientId,
        item.classroom_id,
        academicYearValues,
        feeYearValues
      ]);

      summary.push({
        classroom_id: item.classroom_id,
        name: classRows[0].name,
        yearly_fee: item.yearly_fee,
        students_updated: studentsResult.affectedRows || 0,
        fee_records_updated: feeRecordsResult.affectedRows || 0
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Class-wise school fees updated successfully',
      data: {
        client_id: clientId,
        academic_year: normalizeAcademicYear(academicYear),
        summary
      }
    });
  } catch (error) {
    await connection.rollback();
    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

async function previewAcademicYearRollover(req, res) {
  try {
    await ensureSettingsSchema();
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const clientId = normalizePositiveInteger(req.query.client_id || req.query.clientId || req.decoded?.client_id);
  const fromAcademicYear = normalizeAcademicYear(req.query.from_academic_year || req.query.fromAcademicYear);
  const toAcademicYear = normalizeAcademicYear(req.query.to_academic_year || req.query.toAcademicYear);

  if (!clientId || !fromAcademicYear || !toAcademicYear) {
    return res.status(400).json({
      success: false,
      message: 'Client, from academic year, and to academic year are required'
    });
  }

  if (fromAcademicYear === toAcademicYear) {
    return res.status(400).json({
      success: false,
      message: 'From and to academic year must be different'
    });
  }

  try {
    const plan = await buildAcademicYearRolloverPlan(pool.promise(), clientId, fromAcademicYear, toAcademicYear);

    return res.status(200).json({
      success: true,
      data: promotionResponseData(clientId, fromAcademicYear, toAcademicYear, plan)
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function applyAcademicYearRollover(req, res) {
  try {
    await ensureSettingsSchema();
  } catch (error) {
    return sendDatabaseError(res, error);
  }

  const clientId = normalizePositiveInteger(getValue(req.body, 'clientId', 'client_id') || req.query.client_id || req.decoded?.client_id);
  const fromAcademicYear = normalizeAcademicYear(getValue(req.body, 'fromAcademicYear', 'from_academic_year'));
  const toAcademicYear = normalizeAcademicYear(getValue(req.body, 'toAcademicYear', 'to_academic_year'));
  const payload = {
    current_academic_year: toAcademicYear,
    academic_year_start_date: normalizeDate(getValue(req.body, 'academicYearStartDate', 'academic_year_start_date')),
    academic_year_end_date: normalizeDate(getValue(req.body, 'academicYearEndDate', 'academic_year_end_date'))
  };

  if (!clientId || !fromAcademicYear || !toAcademicYear) {
    return res.status(400).json({
      success: false,
      message: 'Client, from academic year, and to academic year are required'
    });
  }

  if (fromAcademicYear === toAcademicYear) {
    return res.status(400).json({
      success: false,
      message: 'From and to academic year must be different'
    });
  }

  if (!payload.academic_year_start_date || !payload.academic_year_end_date) {
    return res.status(400).json({
      success: false,
      message: 'New academic year start and end dates are required'
    });
  }

  if (payload.academic_year_end_date < payload.academic_year_start_date) {
    return res.status(400).json({
      success: false,
      message: 'Academic end date cannot be before start date'
    });
  }

  const connection = await pool.promise().getConnection();
  const batchId = buildBatchId();

  try {
    await connection.beginTransaction();

    const plan = await buildAcademicYearRolloverPlan(connection, clientId, fromAcademicYear, toAcademicYear, {
      lockStudents: true
    });
    const summary = promotionSummary(plan);

    if (!summary.total_students) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `No active students found in ${fromAcademicYear}`
      });
    }

    if (summary.blocked_students) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Some students cannot be promoted. Preview the rollover and fix missing classes or sections first.',
        data: promotionResponseData(clientId, fromAcademicYear, toAcademicYear, plan)
      });
    }

    const rollCounters = await loadRollCounters(connection, clientId, toAcademicYear);
    const appliedPlan = [];

    for (const item of plan) {
      if (item.action === 'PROMOTE') {
        const toRollNumber = nextRollNumber(rollCounters, item.to_classroom_id, item.to_section);
        const toAdmissionNumber = buildStudentAdmissionNumber({
          academicYear: toAcademicYear,
          classroomName: item.to_classroom_name,
          rollNumber: toRollNumber
        });
        const appliedItem = {
          ...item,
          to_roll_number: toRollNumber,
          to_admission_number: toAdmissionNumber
        };

        await connection.query(`
          UPDATE ${studentsTable}
          SET
            admission_number = ?,
            academic_year = ?,
            class_name = ?,
            grade_level = ?,
            current_grade = ?,
            section = ?,
            roll_number = ?,
            enrollment_status = 'Active'
          WHERE student_id = ?
            AND client_id = ?
        `, [
          toAdmissionNumber,
          toAcademicYear,
          item.to_classroom_id,
          item.to_classroom_name,
          item.to_classroom_name,
          item.to_section,
          toRollNumber,
          item.student_id,
          clientId
        ]);

        await insertPromotionAudit(connection, batchId, clientId, fromAcademicYear, toAcademicYear, appliedItem);
        appliedPlan.push(appliedItem);
        continue;
      }

      const appliedItem = {
        ...item,
        to_roll_number: null
      };

      await connection.query(`
        UPDATE ${studentsTable}
        SET
          academic_year = ?,
          enrollment_status = 'Alumni',
          roll_number = NULL
        WHERE student_id = ?
          AND client_id = ?
      `, [toAcademicYear, item.student_id, clientId]);

      await insertPromotionAudit(connection, batchId, clientId, fromAcademicYear, toAcademicYear, appliedItem);
      appliedPlan.push(appliedItem);
    }

    await saveAcademicCalendar(connection, clientId, payload);
    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Academic year moved from ${fromAcademicYear} to ${toAcademicYear}`,
      data: promotionResponseData(clientId, fromAcademicYear, toAcademicYear, appliedPlan, {
        batch_id: batchId,
        academic_year_start_date: payload.academic_year_start_date,
        academic_year_end_date: payload.academic_year_end_date
      })
    });
  } catch (error) {
    await connection.rollback();
    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

async function changePassword(req, res) {
  const loginId = normalizePositiveInteger(req.decoded?.login_id || req.decoded?.loginId);
  const clientId = normalizePositiveInteger(req.decoded?.client_id || req.decoded?.clientId);
  const currentPassword = normalizeText(getValue(req.body, 'currentPassword', 'current_password'));
  const newPassword = normalizeText(getValue(req.body, 'newPassword', 'new_password'));
  const confirmPassword = normalizeText(getValue(req.body, 'confirmPassword', 'confirm_password'));

  if (!loginId) {
    return res.status(401).json({
      success: false,
      message: 'Login session is required'
    });
  }

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password, new password, and confirmation are required'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters'
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password and confirmation do not match'
    });
  }

  if (newPassword === currentPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password must be different from current password'
    });
  }

  try {
    const [rows] = await pool.promise().query(`
      SELECT login_id, passkey, salt
      FROM ${loginTable}
      WHERE login_id = ?
        AND (? IS NULL OR client_id = ?)
      LIMIT 1
    `, [loginId, clientId || null, clientId || null]);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Login account not found'
      });
    }

    const login = rows[0];
    if (!passwordMatches(currentPassword, login.salt, login.passkey)) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const nextPassword = hashPassword(newPassword);
    await pool.promise().query(`
      UPDATE ${loginTable}
      SET passkey = ?, salt = ?, password = NULL
      WHERE login_id = ?
    `, [nextPassword.passkey, nextPassword.salt, loginId]);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

module.exports = {
  getSchoolBranding,
  updateSchoolBranding,
  getAcademicCalendar,
  updateAcademicCalendar,
  getClassFeeSetup,
  updateClassFeeSetup,
  previewAcademicYearRollover,
  applyAcademicYearRollover,
  changePassword
};
