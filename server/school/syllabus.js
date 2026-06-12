const { pool } = require('../config');
const { classroomOrderSql } = require('./classroom-order');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || process.env.DB_DATABASE || 'school';
const syllabusPlansTable = table('syllabus_plans');
const syllabusUnitsTable = table('syllabus_units');
const classroomsTable = table('classrooms');
const subjectsTable = table('subjects');

let schemaReady = null;

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

function normalizeText(value, fallback = null) {
  if (value === undefined || value === null) {
    return fallback;
  }

  const trimmed = String(value).trim();
  return trimmed || fallback;
}

function normalizeDate(value) {
  const trimmed = normalizeText(value);
  return trimmed || null;
}

function normalizeStatus(value, fallback = 'Not Started') {
  const normalized = normalizeText(value, fallback);
  return ['Not Started', 'In Progress', 'Completed'].includes(normalized) ? normalized : fallback;
}

function normalizeAcademicYear(value) {
  const now = new Date();
  return normalizeText(value, `${now.getFullYear()}-${now.getFullYear() + 1}`);
}

async function ensureSyllabusSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await pool.promise().query(`
        CREATE TABLE IF NOT EXISTS ${syllabusPlansTable} (
          syllabus_plan_id INT NOT NULL AUTO_INCREMENT,
          client_id BIGINT NOT NULL,
          classroom_id INT NOT NULL,
          subject_id INT NOT NULL,
          academic_year VARCHAR(20) NOT NULL,
          status ENUM('Not Started','In Progress','Completed') NOT NULL DEFAULT 'Not Started',
          notes TEXT DEFAULT NULL,
          created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (syllabus_plan_id),
          UNIQUE KEY uq_syllabus_plan_scope (client_id, classroom_id, subject_id, academic_year),
          KEY idx_syllabus_plan_class_year (client_id, classroom_id, academic_year),
          KEY idx_syllabus_plan_subject (subject_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      await pool.promise().query(`
        CREATE TABLE IF NOT EXISTS ${syllabusUnitsTable} (
          syllabus_unit_id INT NOT NULL AUTO_INCREMENT,
          syllabus_plan_id INT NOT NULL,
          unit_title VARCHAR(180) NOT NULL,
          topics TEXT DEFAULT NULL,
          target_date DATE DEFAULT NULL,
          completed_date DATE DEFAULT NULL,
          status ENUM('Not Started','In Progress','Completed') NOT NULL DEFAULT 'Not Started',
          sort_order INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (syllabus_unit_id),
          KEY idx_syllabus_units_plan (syllabus_plan_id),
          KEY idx_syllabus_units_status (status),
          CONSTRAINT syllabus_units_plan_fk
            FOREIGN KEY (syllabus_plan_id)
            REFERENCES ${syllabusPlansTable} (syllabus_plan_id)
            ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  return schemaReady;
}

async function getSyllabus(req, res) {
  const clientId = normalizePositiveInteger(req.query.client_id);
  const classroomId = normalizePositiveInteger(req.query.classroom_id);
  const subjectId = normalizePositiveInteger(req.query.subject_id);
  const academicYear = normalizeText(req.query.academic_year);
  const conditions = ['sp.client_id = ?'];
  const values = [clientId];

  if (!clientId) {
    return res.status(400).json({ success: false, message: 'client_id is required' });
  }

  if (classroomId) {
    conditions.push('sp.classroom_id = ?');
    values.push(classroomId);
  }

  if (subjectId) {
    conditions.push('sp.subject_id = ?');
    values.push(subjectId);
  }

  if (academicYear) {
    conditions.push('sp.academic_year = ?');
    values.push(academicYear);
  }

  try {
    await ensureSyllabusSchema();
    const [rows] = await pool.promise().query(`
      SELECT
        sp.syllabus_plan_id,
        sp.client_id,
        sp.classroom_id,
        c.name AS classroom_name,
        sp.subject_id,
        s.sub_name AS subject_name,
        sp.academic_year,
        sp.status AS plan_status,
        sp.notes,
        su.syllabus_unit_id,
        su.unit_title,
        su.topics,
        su.target_date,
        su.completed_date,
        su.status AS unit_status,
        su.sort_order
      FROM ${syllabusPlansTable} sp
      LEFT JOIN ${classroomsTable} c ON c.classroom_id = sp.classroom_id
      LEFT JOIN ${subjectsTable} s ON s.subject_id = sp.subject_id
      LEFT JOIN ${syllabusUnitsTable} su ON su.syllabus_plan_id = sp.syllabus_plan_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${classroomOrderSql('c.name')}, s.sub_name ASC, sp.academic_year DESC, su.sort_order ASC, su.syllabus_unit_id ASC
    `, values);

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function createSyllabusUnit(req, res) {
  const payload = buildUnitCreatePayload(req.body);

  if (!payload.client_id || !payload.classroom_id || !payload.subject_id || !payload.academic_year || !payload.unit_title) {
    return res.status(400).json({
      success: false,
      message: 'Client, class, subject, academic year, and unit title are required'
    });
  }

  const connection = await pool.promise().getConnection();

  try {
    await ensureSyllabusSchema();
    await connection.beginTransaction();

    const [planResult] = await connection.query(`
      INSERT INTO ${syllabusPlansTable}
        (client_id, classroom_id, subject_id, academic_year, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        notes = VALUES(notes),
        updated_at = CURRENT_TIMESTAMP
    `, [
      payload.client_id,
      payload.classroom_id,
      payload.subject_id,
      payload.academic_year,
      payload.plan_status,
      payload.notes
    ]);

    const [[plan]] = await connection.query(`
      SELECT syllabus_plan_id
      FROM ${syllabusPlansTable}
      WHERE client_id = ? AND classroom_id = ? AND subject_id = ? AND academic_year = ?
      LIMIT 1
    `, [payload.client_id, payload.classroom_id, payload.subject_id, payload.academic_year]);

    const planId = plan?.syllabus_plan_id || planResult.insertId;

    const [[orderRow]] = await connection.query(`
      SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order
      FROM ${syllabusUnitsTable}
      WHERE syllabus_plan_id = ?
    `, [planId]);

    const [unitResult] = await connection.query(`
      INSERT INTO ${syllabusUnitsTable}
        (syllabus_plan_id, unit_title, topics, target_date, completed_date, status, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      planId,
      payload.unit_title,
      payload.topics,
      payload.target_date,
      payload.completed_date,
      payload.unit_status,
      normalizePositiveInteger(payload.sort_order) || orderRow.next_order || 1
    ]);

    await refreshPlanStatus(connection, planId);
    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Syllabus unit saved successfully',
      data: {
        syllabus_plan_id: planId,
        syllabus_unit_id: unitResult.insertId
      }
    });
  } catch (error) {
    await connection.rollback();
    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

async function updateSyllabusUnit(req, res) {
  const unitId = normalizePositiveInteger(req.params.unitId);
  const payload = buildUnitUpdatePayload(req.body);

  if (!unitId) {
    return res.status(400).json({ success: false, message: 'Valid syllabus unit id is required' });
  }

  if (!Object.keys(payload).length) {
    return res.status(400).json({ success: false, message: 'No syllabus unit data supplied' });
  }

  const connection = await pool.promise().getConnection();

  try {
    await ensureSyllabusSchema();
    await connection.beginTransaction();

    const [[unit]] = await connection.query(`SELECT syllabus_plan_id FROM ${syllabusUnitsTable} WHERE syllabus_unit_id = ?`, [unitId]);
    if (!unit) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Syllabus unit not found' });
    }

    await connection.query(`UPDATE ${syllabusUnitsTable} SET ? WHERE syllabus_unit_id = ?`, [payload, unitId]);
    await refreshPlanStatus(connection, unit.syllabus_plan_id);
    await connection.commit();

    return res.status(200).json({ success: true, message: 'Syllabus unit updated successfully' });
  } catch (error) {
    await connection.rollback();
    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

async function deleteSyllabusUnit(req, res) {
  const unitId = normalizePositiveInteger(req.params.unitId);
  const connection = await pool.promise().getConnection();

  if (!unitId) {
    return res.status(400).json({ success: false, message: 'Valid syllabus unit id is required' });
  }

  try {
    await ensureSyllabusSchema();
    await connection.beginTransaction();

    const [[unit]] = await connection.query(`SELECT syllabus_plan_id FROM ${syllabusUnitsTable} WHERE syllabus_unit_id = ?`, [unitId]);
    if (!unit) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Syllabus unit not found' });
    }

    await connection.query(`DELETE FROM ${syllabusUnitsTable} WHERE syllabus_unit_id = ?`, [unitId]);
    await refreshPlanStatus(connection, unit.syllabus_plan_id);
    await connection.commit();

    return res.status(200).json({ success: true, message: 'Syllabus unit deleted successfully' });
  } catch (error) {
    await connection.rollback();
    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

function buildUnitCreatePayload(body) {
  return {
    client_id: normalizePositiveInteger(body.clientId || body.client_id),
    classroom_id: normalizePositiveInteger(body.classroomId || body.classroom_id),
    subject_id: normalizePositiveInteger(body.subjectId || body.subject_id),
    academic_year: normalizeAcademicYear(body.academicYear || body.academic_year),
    plan_status: normalizeStatus(body.planStatus || body.plan_status),
    notes: normalizeText(body.notes),
    unit_title: normalizeText(body.unitTitle || body.unit_title),
    topics: normalizeText(body.topics),
    target_date: normalizeDate(body.targetDate || body.target_date),
    completed_date: normalizeDate(body.completedDate || body.completed_date),
    unit_status: normalizeStatus(body.unitStatus || body.unit_status || body.status),
    sort_order: normalizePositiveInteger(body.sortOrder || body.sort_order)
  };
}

function buildUnitUpdatePayload(body) {
  const payload = {};

  if (body.unitTitle !== undefined || body.unit_title !== undefined) {
    payload.unit_title = normalizeText(body.unitTitle || body.unit_title);
  }

  if (body.topics !== undefined) {
    payload.topics = normalizeText(body.topics);
  }

  if (body.targetDate !== undefined || body.target_date !== undefined) {
    payload.target_date = normalizeDate(body.targetDate || body.target_date);
  }

  if (body.completedDate !== undefined || body.completed_date !== undefined) {
    payload.completed_date = normalizeDate(body.completedDate || body.completed_date);
  }

  if (body.unitStatus !== undefined || body.unit_status !== undefined || body.status !== undefined) {
    const status = normalizeStatus(body.unitStatus || body.unit_status || body.status);
    payload.status = status;
    if (status === 'Completed' && !payload.completed_date && !body.completedDate && !body.completed_date) {
      payload.completed_date = new Date().toISOString().split('T')[0];
    }
    if (status !== 'Completed' && !body.completedDate && !body.completed_date) {
      payload.completed_date = null;
    }
  }

  if (body.sortOrder !== undefined || body.sort_order !== undefined) {
    payload.sort_order = normalizePositiveInteger(body.sortOrder || body.sort_order) || 0;
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
}

async function refreshPlanStatus(connection, planId) {
  const [[summary]] = await connection.query(`
    SELECT
      COUNT(*) AS total_units,
      SUM(status = 'Completed') AS completed_units,
      SUM(status = 'In Progress') AS in_progress_units
    FROM ${syllabusUnitsTable}
    WHERE syllabus_plan_id = ?
  `, [planId]);

  const totalUnits = Number(summary.total_units || 0);
  const completedUnits = Number(summary.completed_units || 0);
  const inProgressUnits = Number(summary.in_progress_units || 0);
  const status = totalUnits > 0 && completedUnits === totalUnits
    ? 'Completed'
    : inProgressUnits > 0 || completedUnits > 0
      ? 'In Progress'
      : 'Not Started';

  await connection.query(`UPDATE ${syllabusPlansTable} SET status = ? WHERE syllabus_plan_id = ?`, [status, planId]);
}

module.exports = {
  getSyllabus,
  createSyllabusUnit,
  updateSyllabusUnit,
  deleteSyllabusUnit
};
