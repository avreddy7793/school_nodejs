#!/usr/bin/env node

const path = require('path');
const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', 'lot.env.local') });

const DEFAULT_FILE = '/Users/venkatareddyannareddy/Downloads/comprehensive_student_data_2026-06-06_12-19-30.xlsx';
const DEFAULT_CLIENT_ID = 23;

function parseArgs(argv) {
  const options = {
    file: DEFAULT_FILE,
    clientId: DEFAULT_CLIENT_ID,
    academicYear: currentAcademicYear(),
    commit: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--file' && next) {
      options.file = next;
      index += 1;
    } else if (arg === '--client-id' && next) {
      options.clientId = Number(next);
      index += 1;
    } else if (arg === '--academic-year' && next) {
      options.academicYear = next;
      index += 1;
    } else if (arg === '--commit') {
      options.commit = true;
    } else if (arg === '--help') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/import-students-from-xlsx.js [--file path.xlsx] [--client-id 23] [--academic-year 2026-27] [--commit]

Default mode is a dry-run. Add --commit to create missing classrooms/sections and insert students.
`);
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

function valueOf(row, key) {
  return row[key] === undefined || row[key] === null ? null : row[key];
}

function text(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized || null;
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
        String(day).padStart(2, '0'),
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
    last_name: asNullableText(sourceLastName || parsed.last_name || 'N/A', 50),
  };
}

function splitFullName(fullName) {
  const cleaned = String(fullName || '')
    .replace(/\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return {
      first_name: 'Unknown',
      middle_name: null,
      last_name: 'N/A',
    };
  }

  const tokens = cleaned.split(' ');
  if (tokens.length === 1) {
    return {
      first_name: tokens[0],
      middle_name: null,
      last_name: 'N/A',
    };
  }

  if (tokens.length === 2 && tokens[0].length <= 2) {
    return {
      first_name: tokens[1],
      middle_name: null,
      last_name: tokens[0],
    };
  }

  return {
    first_name: tokens[0],
    middle_name: tokens.slice(1, -1).join(' ') || null,
    last_name: tokens[tokens.length - 1],
  };
}

function classKey(value) {
  const normalized = String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

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

function escapeIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``;
}

function cleanAdmissionNumber(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .slice(0, 50);
}

function sourceAdmissionBase(row) {
  return cleanAdmissionNumber(valueOf(row, 'Register No'))
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
    source_username: text(valueOf(row, 'Username')),
    source_full_name: text(valueOf(row, 'Full Name')),
    caste: text(valueOf(row, 'Caste')),
    sub_caste: text(valueOf(row, 'Sub Caste')),
    student_type: text(valueOf(row, 'Student Type')),
    medium: text(valueOf(row, 'Medium')),
    mother_tongue: text(valueOf(row, 'Mother Tongue')),
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
  const sourceNotes = buildSourceNotes(row);

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
      section: asNullableText(valueOf(row, 'Section'), 5) || 'A',
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
      achievements: sourceNotes,
      created_by: null,
      updated_by: null,
    },
    dobWasMissing,
    admissionDateWasMissing,
    dateOfBirth,
  };
}

function loadWorkbookRows(file) {
  const workbook = XLSX.readFile(file, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Workbook has no sheets.');
  }

  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: null,
    raw: false,
  });
}

function getDatabaseName() {
  return process.env.DB_SCHOOL_DATABASE || process.env.DB_DATABASE || 'school';
}

async function connect() {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: getDatabaseName(),
    port: process.env.DB_PORT || 3306,
    timezone: '+05:30',
  });
}

async function loadMetadata(connection, clientId) {
  const database = getDatabaseName();
  const [classrooms] = await connection.query(
    `SELECT classroom_id, client_id, name, capacity FROM ${escapeIdentifier(database)}.${escapeIdentifier('classrooms')} WHERE client_id = ? ORDER BY classroom_id`,
    [clientId],
  );
  const [sections] = await connection.query(
    `SELECT section_id, client_id, classroom_id, section_name FROM ${escapeIdentifier(database)}.${escapeIdentifier('sections')} WHERE client_id = ? ORDER BY section_id`,
    [clientId],
  );
  const [students] = await connection.query(
    `SELECT admission_number FROM ${escapeIdentifier(database)}.${escapeIdentifier('students')} WHERE client_id = ?`,
    [clientId],
  );

  return { classrooms, sections, students };
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

function buildSectionSet(sections) {
  const set = new Set();
  sections.forEach((section) => {
    set.add(`${section.classroom_id}|${sectionKey(section.section_name)}`);
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

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!Number.isInteger(options.clientId) || options.clientId <= 0) {
    throw new Error('--client-id must be a positive integer.');
  }

  const rows = loadWorkbookRows(options.file);
  const admissionNumbers = buildAdmissionNumbers(rows);
  const connection = await connect();

  const database = getDatabaseName();
  const classroomsTable = `${escapeIdentifier(database)}.${escapeIdentifier('classrooms')}`;
  const sectionsTable = `${escapeIdentifier(database)}.${escapeIdentifier('sections')}`;
  const studentsTable = `${escapeIdentifier(database)}.${escapeIdentifier('students')}`;
  const stats = {
    mode: options.commit ? 'commit' : 'dry-run',
    sourceRows: rows.length,
    clientId: options.clientId,
    academicYear: options.academicYear,
    sourceClassSections: summarizeSource(rows),
    existingStudentsSkipped: 0,
    classroomsCreated: 0,
    sectionsCreated: 0,
    studentsInserted: 0,
    missingDateOfBirthDefaultedTo1970: 0,
    placeholder1970DateOfBirth: 0,
    missingAdmissionDateDefaultedToToday: 0,
    duplicateIncomingAdmissionNumbers: 0,
    errors: [],
  };

  const duplicateIncoming = admissionNumbers.length - new Set(admissionNumbers).size;
  stats.duplicateIncomingAdmissionNumbers = duplicateIncoming;
  if (duplicateIncoming > 0) {
    throw new Error(`Incoming admission numbers are not unique after cleanup: ${duplicateIncoming} duplicates.`);
  }

  try {
    if (options.commit) {
      await connection.beginTransaction();
    }

    let metadata = await loadMetadata(connection, options.clientId);
    const classroomMap = buildClassroomMap(metadata.classrooms);
    const sectionSet = buildSectionSet(metadata.sections);
    const existingAdmissionNumbers = new Set(metadata.students.map((student) => student.admission_number));

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
        client_id: options.clientId,
        name: sourceClassNames.get(key),
        capacity: Math.max(100, count),
        facilities: 'Class Room',
      };

      if (options.commit) {
        const [result] = await connection.query(`INSERT INTO ${classroomsTable} SET ?`, classroom);
        classroom.classroom_id = result.insertId;
      } else {
        classroom.classroom_id = `DRY_RUN_${key}`;
      }

      classroomMap.set(key, classroom);
      stats.classroomsCreated += 1;
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

      if (options.commit) {
        await connection.query(`INSERT INTO ${sectionsTable} SET ?`, {
          client_id: options.clientId,
          classroom_id: classroom.classroom_id,
          section_name: sourceSection,
        });
      }

      sectionSet.add(key);
      stats.sectionsCreated += 1;
    }

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const admissionNumber = admissionNumbers[index];
      if (existingAdmissionNumbers.has(admissionNumber)) {
        stats.existingStudentsSkipped += 1;
        continue;
      }

      const classroom = classroomMap.get(classKey(valueOf(row, 'Class')));
      if (!classroom) {
        stats.errors.push(`Cannot insert ${admissionNumber}: no classroom for class "${valueOf(row, 'Class')}".`);
        continue;
      }

      const built = buildStudentPayload(row, admissionNumber, classroom, options.academicYear, options.clientId);
      if (built.dobWasMissing) {
        stats.missingDateOfBirthDefaultedTo1970 += 1;
      }
      if (built.dateOfBirth === '1970-01-01') {
        stats.placeholder1970DateOfBirth += 1;
      }
      if (built.admissionDateWasMissing) {
        stats.missingAdmissionDateDefaultedToToday += 1;
      }

      if (options.commit) {
        await connection.query(`INSERT INTO ${studentsTable} SET ?`, built.payload);
        existingAdmissionNumbers.add(admissionNumber);
      }

      stats.studentsInserted += 1;
    }

    if (stats.errors.length) {
      throw new Error(`Import validation failed with ${stats.errors.length} error(s).`);
    }

    if (options.commit) {
      await connection.commit();
    }

    console.log(JSON.stringify(stats, null, 2));
  } catch (error) {
    if (options.commit) {
      await connection.rollback();
    }
    error.importStats = stats;
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  if (error.importStats) {
    console.error(JSON.stringify(error.importStats, null, 2));
  }
  process.exit(1);
});
