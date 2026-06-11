const XLSX = require('xlsx');
const { pool } = require('../config');
const { buildStudentAdmissionNumber } = require('./admission-number');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || process.env.DB_DATABASE || 'school';
const classroomsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('classrooms')}`;
const sectionsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('sections')}`;
const studentsTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('students')}`;

function escapeIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``;
}

function text(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized || null;
}

function valueOf(row, key) {
  return row[key] === undefined || row[key] === null ? null : row[key];
}

function asNullableText(value, maxLength) {
  const normalized = text(value);
  if (!normalized) {
    return null;
  }

  return maxLength ? normalized.slice(0, maxLength) : normalized;
}

function numericText(value, maxLength) {
  const normalized = text(value);
  if (!normalized) {
    return null;
  }

  const digits = normalized.replace(/[^\d+]/g, '');
  return (digits || normalized).slice(0, maxLength);
}

function parseInteger(value) {
  const normalized = text(value);
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isInteger(parsed) ? parsed : null;
}

function currentAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startYear = month >= 4 ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseDate(value, fallback) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const normalized = text(value);
  if (!normalized) {
    return fallback;
  }

  const dateMatch = normalized.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (dateMatch) {
    const day = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    let year = Number(dateMatch[3]);
    year = year < 100 ? year + 2000 : year;

    if (isValidDateParts(year, month, day)) {
      return [
        String(year).padStart(4, '0'),
        String(month).padStart(2, '0'),
        String(day).padStart(2, '0')
      ].join('-');
    }
  }

  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return fallback;
}

function isValidDateParts(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function normalizeGender(value) {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized === 'M' || normalized === 'MALE') {
    return 'Male';
  }
  if (normalized === 'F' || normalized === 'FEMALE') {
    return 'Female';
  }
  return 'Other';
}

function normalizeStatus(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'inactive') {
    return 'Inactive';
  }
  if (normalized === 'alumni') {
    return 'Alumni';
  }
  return 'Active';
}

function normalizeBloodGroup(value) {
  const normalized = text(value);
  if (!normalized || normalized === '0') {
    return null;
  }

  return normalized.slice(0, 5);
}

function splitName(row) {
  const sourceFirstName = text(valueOf(row, 'First Name'));
  const sourceLastName = text(valueOf(row, 'Last Name'));
  const parsed = splitFullName(text(valueOf(row, 'Full Name')));

  return {
    first_name: asNullableText(sourceFirstName || parsed.first_name || 'Unknown', 50),
    middle_name: asNullableText(parsed.middle_name, 50),
    last_name: asNullableText(sourceLastName || parsed.last_name || 'N/A', 50)
  };
}

function splitFullName(fullName) {
  const cleaned = String(fullName || '').replace(/\./g, ' ').replace(/\s+/g, ' ').trim();

  if (!cleaned) {
    return { first_name: 'Unknown', middle_name: null, last_name: 'N/A' };
  }

  const tokens = cleaned.split(' ');
  if (tokens.length === 1) {
    return { first_name: tokens[0], middle_name: null, last_name: 'N/A' };
  }

  if (tokens.length === 2 && tokens[0].length <= 2) {
    return { first_name: tokens[1], middle_name: null, last_name: tokens[0] };
  }

  return {
    first_name: tokens[0],
    middle_name: tokens.slice(1, -1).join(' ') || null,
    last_name: tokens[tokens.length - 1]
  };
}

function classKey(value) {
  const normalized = String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();

  if (normalized.includes('nursery')) {
    return 'NURSERY';
  }
  if (normalized === 'lkg' || normalized.includes('lower kindergarten')) {
    return 'LKG';
  }
  if (normalized === 'ukg' || normalized.includes('upper kindergarten')) {
    return 'UKG';
  }

  const numberMatch = normalized.match(/\d+/);
  if (numberMatch) {
    return String(Number(numberMatch[0]));
  }

  return normalized.toUpperCase();
}

function sectionKey(value) {
  return String(value || '').trim().toUpperCase();
}

function cleanAdmissionNumber(value) {
  return String(value || '').trim().replace(/\s+/g, '').slice(0, 50);
}

function sourceAdmissionBase(row) {
  return cleanAdmissionNumber(valueOf(row, 'Register No'))
    || cleanAdmissionNumber(valueOf(row, 'Admission No'))
    || cleanAdmissionNumber(valueOf(row, 'Admission Number'))
    || cleanAdmissionNumber(valueOf(row, 'Username'))
    || cleanAdmissionNumber(`IMPORT-${valueOf(row, 'Sl No') || ''}`);
}

function buildAdmissionNumbers(rows) {
  const baseCounts = new Map();
  rows.forEach((row) => {
    const base = sourceAdmissionBase(row);
    baseCounts.set(base, (baseCounts.get(base) || 0) + 1);
  });

  const seen = new Set();
  return rows.map((row, index) => {
    const slNo = cleanAdmissionNumber(valueOf(row, 'Sl No')) || String(index + 1);
    const base = sourceAdmissionBase(row) || `IMPORT-${slNo}`;
    let candidate = base;

    if ((baseCounts.get(base) || 0) > 1) {
      candidate = `${base.slice(0, 40)}-SL${slNo}`.slice(0, 50);
    }

    let suffix = 2;
    while (seen.has(candidate)) {
      candidate = `${base.slice(0, 45)}-${suffix}`.slice(0, 50);
      suffix += 1;
    }

    seen.add(candidate);
    return candidate;
  });
}

function buildSourceNotes(row) {
  const notes = {
    sl_no: text(valueOf(row, 'Sl No')),
    source_register_no: text(valueOf(row, 'Register No')),
    source_username: text(valueOf(row, 'Username')),
    source_full_name: text(valueOf(row, 'Full Name')),
    caste: text(valueOf(row, 'Caste')),
    sub_caste: text(valueOf(row, 'Sub Caste')),
    student_type: text(valueOf(row, 'Student Type')),
    medium: text(valueOf(row, 'Medium')),
    mother_tongue: text(valueOf(row, 'Mother Tongue'))
  };

  Object.keys(notes).forEach((key) => {
    if (!notes[key]) {
      delete notes[key];
    }
  });

  return Object.keys(notes).length ? JSON.stringify(notes) : null;
}

function buildStudentPayload(row, admissionNumber, classroom, academicYear, clientId) {
  const names = splitName(row);
  const fatherName = asNullableText(valueOf(row, 'Father Name'), 100);
  const motherName = asNullableText(valueOf(row, 'Mother Name'), 100);
  const primaryPhone = numericText(valueOf(row, 'Phone'), 15);
  const alternatePhone = numericText(valueOf(row, 'Alternative Phone 1'), 15)
    || numericText(valueOf(row, 'Alternative Phone 2'), 15);
  const address = asNullableText(valueOf(row, 'Address'), 100);
  const village = asNullableText(valueOf(row, 'Village'), 50);
  const country = asNullableText(valueOf(row, 'Country'), 50);
  const dobWasMissing = !text(valueOf(row, 'Date of Birth'));
  const admissionDateWasMissing = !text(valueOf(row, 'Admission Date'));
  const dateOfBirth = parseDate(valueOf(row, 'Date of Birth'), '1970-01-01');
  const admissionDate = parseDate(valueOf(row, 'Admission Date'), today());

  return {
    payload: {
      client_id: clientId,
      yearly_fee: null,
      admission_number: admissionNumber,
      first_name: names.first_name,
      middle_name: names.middle_name,
      last_name: names.last_name,
      class_name: classroom.classroom_id,
      date_of_birth: dateOfBirth,
      gender: normalizeGender(valueOf(row, 'Gender')),
      blood_group: normalizeBloodGroup(valueOf(row, 'Blood Group')),
      nationality: country && country.toLowerCase() === 'india' ? 'Indian' : null,
      religion: asNullableText(valueOf(row, 'Religion'), 50),
      transport_id: null,
      pickupPoint: null,
      address_line1: address,
      address_line2: village && village !== address ? village.slice(0, 100) : null,
      city: village || address,
      state: asNullableText(valueOf(row, 'State'), 50),
      postal_code: null,
      country,
      phone_number: primaryPhone,
      alternate_phone: alternatePhone,
      email: asNullableText(valueOf(row, 'Email'), 100),
      emergency_contact_name: fatherName || motherName,
      emergency_contact_relation: fatherName ? 'Father' : (motherName ? 'Mother' : null),
      emergency_contact_number: primaryPhone || alternatePhone,
      admission_date: admissionDate,
      enrollment_status: normalizeStatus(valueOf(row, 'Active Status')),
      grade_level: classroom.name,
      section: asNullableText(valueOf(row, 'Section'), 20) || 'A',
      roll_number: parseInteger(valueOf(row, 'Roll Number')),
      academic_year: academicYear,
      father_name: fatherName,
      father_occupation: null,
      father_contact: primaryPhone,
      mother_name: motherName,
      mother_occupation: null,
      mother_contact: alternatePhone,
      guardian_name: fatherName || motherName,
      guardian_relation: fatherName ? 'Father' : (motherName ? 'Mother' : null),
      guardian_contact: primaryPhone || alternatePhone,
      current_grade: classroom.name,
      previous_school: null,
      marks_obtained: null,
      allergies: null,
      medical_conditions: null,
      vaccination_status: null,
      total_days_present: 0,
      total_days_absent: 0,
      club_membership: null,
      sports_participation: null,
      achievements: buildSourceNotes(row),
      created_by: null,
      updated_by: null
    },
    dobWasMissing,
    admissionDateWasMissing,
    dateOfBirth
  };
}

function loadWorkbookRows(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throwValidationError('Workbook has no sheets.');
  }

  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: null,
    raw: false
  });
}

async function loadMetadata(connection, clientId) {
  const [classrooms] = await connection.query(
    `SELECT classroom_id, client_id, name, capacity FROM ${classroomsTable} WHERE client_id = ? ORDER BY classroom_id`,
    [clientId]
  );
  const [sections] = await connection.query(
    `SELECT * FROM ${sectionsTable} WHERE client_id = ? ORDER BY section_id`,
    [clientId]
  );
  const [students] = await connection.query(
    `SELECT student_id, admission_number, class_name, roll_number, academic_year, achievements FROM ${studentsTable} WHERE client_id = ?`,
    [clientId]
  );

  return { classrooms, sections, students };
}

async function getSectionMetadata(connection) {
  const [columns] = await connection.query(`SHOW COLUMNS FROM ${sectionsTable}`);
  const names = new Set(columns.map((column) => column.Field));
  return {
    names,
    nameColumn: ['section_name', 'name', 'section', 'label'].find((column) => names.has(column)) || 'section_name'
  };
}

function buildClassroomMap(classrooms) {
  const map = new Map();
  classrooms.forEach((classroom) => {
    const key = classKey(classroom.name);
    if (!map.has(key)) {
      map.set(key, classroom);
    }
  });
  return map;
}

function buildSectionSet(sections, sectionMeta) {
  const set = new Set();
  sections.forEach((section) => {
    const classroomId = section.classroom_id;
    const sectionName = section[sectionMeta.nameColumn] || section.section_name || section.name || section.section;
    set.add(`${classroomId}|${sectionKey(sectionName)}`);
  });
  return set;
}

function summarizeSource(rows) {
  const classSections = {};
  rows.forEach((row) => {
    const key = `${text(valueOf(row, 'Class')) || 'UNKNOWN'} | ${text(valueOf(row, 'Section')) || 'UNKNOWN'}`;
    classSections[key] = (classSections[key] || 0) + 1;
  });
  return classSections;
}

function placementUpdatePayload(payload) {
  return {
    admission_number: payload.admission_number,
    class_name: payload.class_name,
    grade_level: payload.grade_level,
    current_grade: payload.current_grade,
    section: payload.section,
    roll_number: payload.roll_number,
    academic_year: payload.academic_year,
    enrollment_status: payload.enrollment_status
  };
}

function parseJsonObject(value) {
  try {
    const parsed = JSON.parse(value || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function existingStudentKeys(student) {
  const notes = parseJsonObject(student.achievements);
  const keys = [
    student.admission_number,
    notes.source_register_no,
    notes.source_username
  ];
  const slNo = cleanAdmissionNumber(notes.sl_no);
  if (slNo) {
    if (notes.source_register_no) {
      keys.push(`${cleanAdmissionNumber(notes.source_register_no).slice(0, 40)}-SL${slNo}`.slice(0, 50));
    }
    if (notes.source_username) {
      keys.push(`${cleanAdmissionNumber(notes.source_username).slice(0, 40)}-SL${slNo}`.slice(0, 50));
    }
    if (notes.source_full_name) {
      keys.push(`${cleanAdmissionNumber(notes.source_full_name).slice(0, 40)}-SL${slNo}`.slice(0, 50));
    }
  }

  return keys
    .map((value) => cleanAdmissionNumber(value))
    .filter(Boolean);
}

function sourceStudentKeys(row, sourceAdmissionKey, index) {
  const slNo = cleanAdmissionNumber(valueOf(row, 'Sl No')) || String(index + 1);
  const baseKeys = [
    sourceAdmissionKey,
    sourceAdmissionBase(row),
    valueOf(row, 'Register No'),
    valueOf(row, 'Admission No'),
    valueOf(row, 'Admission Number'),
    valueOf(row, 'Username')
  ];
  const keys = [...baseKeys];
  baseKeys.forEach((key) => {
    const cleaned = cleanAdmissionNumber(key);
    if (cleaned && slNo) {
      keys.push(`${cleaned.slice(0, 40)}-SL${slNo}`.slice(0, 50));
    }
  });

  const fullName = cleanAdmissionNumber(valueOf(row, 'Full Name'));
  if (fullName && slNo) {
    keys.push(`${fullName.slice(0, 40)}-SL${slNo}`.slice(0, 50));
  }

  return [...new Set(keys.map((key) => cleanAdmissionNumber(key)).filter(Boolean))];
}

function buildExistingStudentMap(students) {
  const map = new Map();
  students.forEach((student) => {
    existingStudentKeys(student).forEach((key) => {
      if (!map.has(key)) {
        map.set(key, student);
      }
    });
  });
  return map;
}

function buildImportRollNumbers(rows) {
  const counters = new Map();
  return rows.map((row) => {
    const key = classKey(valueOf(row, 'Class'));
    const next = Number(counters.get(key) || 0) + 1;
    counters.set(key, next);
    return next;
  });
}

function throwValidationError(message) {
  const error = new Error(message);
  error.code = 'STUDENT_IMPORT_VALIDATION';
  throw error;
}

async function importStudentsFromWorkbook(options) {
  const clientId = Number(options.clientId);
  const academicYear = text(options.academicYear) || currentAcademicYear();
  const updateExisting = options.updateExisting !== false;
  const createMissing = options.createMissing !== false;

  if (!Number.isInteger(clientId) || clientId <= 0) {
    throwValidationError('Client id is required for import.');
  }

  if (!options.buffer?.length) {
    throwValidationError('Choose an Excel file to import.');
  }

  const rows = loadWorkbookRows(options.buffer);
  if (!rows.length) {
    throwValidationError('No student rows found in the first sheet.');
  }

  const sourceAdmissionKeys = buildAdmissionNumbers(rows);
  const importRollNumbers = buildImportRollNumbers(rows);
  const duplicateIncoming = sourceAdmissionKeys.length - new Set(sourceAdmissionKeys).size;
  if (duplicateIncoming > 0) {
    throwValidationError(`Incoming source keys are not unique after cleanup: ${duplicateIncoming} duplicates.`);
  }

  const stats = {
    source_rows: rows.length,
    client_id: clientId,
    academic_year: academicYear,
    file_name: options.fileName || '',
    update_existing: updateExisting,
    create_missing: createMissing,
    source_class_sections: summarizeSource(rows),
    classrooms_created: 0,
    sections_created: 0,
    students_inserted: 0,
    students_updated: 0,
    existing_students_skipped: 0,
    missing_date_of_birth_defaulted_to_1970: 0,
    placeholder_1970_date_of_birth: 0,
    missing_admission_date_defaulted_to_today: 0,
    errors: []
  };

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    const metadata = await loadMetadata(connection, clientId);
    const classroomMap = buildClassroomMap(metadata.classrooms);
    const sectionMeta = await getSectionMetadata(connection);
    const sectionSet = buildSectionSet(metadata.sections, sectionMeta);
    const existingStudents = buildExistingStudentMap(metadata.students);

    const sourceClassCounts = new Map();
    const sourceClassNames = new Map();
    rows.forEach((row) => {
      const key = classKey(valueOf(row, 'Class'));
      sourceClassCounts.set(key, (sourceClassCounts.get(key) || 0) + 1);
      if (!sourceClassNames.has(key)) {
        sourceClassNames.set(key, text(valueOf(row, 'Class')) || key);
      }
    });

    for (const [key, count] of sourceClassCounts.entries()) {
      if (classroomMap.has(key)) {
        continue;
      }

      const classroom = {
        client_id: clientId,
        name: sourceClassNames.get(key),
        capacity: Math.max(100, count),
        facilities: 'Class Room'
      };
      const [result] = await connection.query(`INSERT INTO ${classroomsTable} SET ?`, classroom);
      classroom.classroom_id = result.insertId;
      classroomMap.set(key, classroom);
      stats.classrooms_created += 1;
    }

    for (const row of rows) {
      const classroom = classroomMap.get(classKey(valueOf(row, 'Class')));
      if (!classroom) {
        stats.errors.push(`No classroom mapping for source class "${valueOf(row, 'Class')}".`);
        continue;
      }

      const sourceSection = asNullableText(valueOf(row, 'Section'), 20) || 'A';
      const key = `${classroom.classroom_id}|${sectionKey(sourceSection)}`;
      if (sectionSet.has(key)) {
        continue;
      }

      const sectionPayload = {
        client_id: clientId,
        classroom_id: classroom.classroom_id,
        [sectionMeta.nameColumn]: sourceSection
      };
      await connection.query(`INSERT INTO ${sectionsTable} SET ?`, sectionPayload);
      sectionSet.add(key);
      stats.sections_created += 1;
    }

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const sourceAdmissionKey = sourceAdmissionKeys[index];
      const classroom = classroomMap.get(classKey(valueOf(row, 'Class')));
      if (!classroom) {
        stats.errors.push(`Cannot import ${sourceAdmissionKey}: no classroom for class "${valueOf(row, 'Class')}".`);
        continue;
      }

      const rollNumber = importRollNumbers[index];
      const admissionNumber = buildStudentAdmissionNumber({
        academicYear,
        classroomName: classroom.name,
        rollNumber
      });
      const built = buildStudentPayload(row, admissionNumber, classroom, academicYear, clientId);
      built.payload.roll_number = rollNumber;
      if (built.dobWasMissing) {
        stats.missing_date_of_birth_defaulted_to_1970 += 1;
      }
      if (built.dateOfBirth === '1970-01-01') {
        stats.placeholder_1970_date_of_birth += 1;
      }
      if (built.admissionDateWasMissing) {
        stats.missing_admission_date_defaulted_to_today += 1;
      }

      const studentKeys = sourceStudentKeys(row, sourceAdmissionKey, index);
      const existingStudent = studentKeys
        .map((key) => existingStudents.get(key))
        .find(Boolean) || existingStudents.get(admissionNumber);
      if (existingStudent) {
        if (!updateExisting) {
          stats.existing_students_skipped += 1;
          continue;
        }

        await connection.query(
          `UPDATE ${studentsTable} SET ? WHERE student_id = ? AND client_id = ?`,
          [placementUpdatePayload(built.payload), existingStudent.student_id, clientId]
        );
        stats.students_updated += 1;
        continue;
      }

      if (!createMissing) {
        stats.existing_students_skipped += 1;
        continue;
      }

      await connection.query(`INSERT INTO ${studentsTable} SET ?`, built.payload);
      const insertedStudent = {
        admission_number: admissionNumber,
        achievements: built.payload.achievements
      };
      existingStudents.set(admissionNumber, insertedStudent);
      studentKeys.forEach((key) => existingStudents.set(key, insertedStudent));
      stats.students_inserted += 1;
    }

    if (stats.errors.length) {
      throwValidationError(`Import failed with ${stats.errors.length} validation error(s).`);
    }

    await connection.commit();
    return stats;
  } catch (error) {
    await connection.rollback();
    error.importStats = stats;
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  importStudentsFromWorkbook
};
