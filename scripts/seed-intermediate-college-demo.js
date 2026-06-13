#!/usr/bin/env node

const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', 'lot.env.local') });

const DEFAULT_CLIENT_ID = 25;
const DEFAULT_ACADEMIC_YEAR = '2026-27';
const DEFAULT_SECTION = 'A';

const GROUPS = [
  {
    code: 'I-MPC',
    name: 'Intermediate 1st Year MPC',
    gradeLabel: '1st Year MPC',
    shortName: 'IMPC',
    fee: { tuition: 26000, admission: 2500, registration: 1000, lab: 3500, books: 2500, uniform: 1500 },
    subjects: ['English', 'Second Language Telugu', 'Mathematics IA', 'Mathematics IB', 'Physics', 'Chemistry', 'Environmental Education', 'Ethics and Human Values']
  },
  {
    code: 'I-BIPC',
    name: 'Intermediate 1st Year BiPC',
    gradeLabel: '1st Year BiPC',
    shortName: 'IBPC',
    fee: { tuition: 28000, admission: 2500, registration: 1000, lab: 4500, books: 2500, uniform: 1500 },
    subjects: ['English', 'Second Language Telugu', 'Botany', 'Zoology', 'Physics', 'Chemistry', 'Environmental Education', 'Ethics and Human Values']
  },
  {
    code: 'I-CEC',
    name: 'Intermediate 1st Year CEC',
    gradeLabel: '1st Year CEC',
    shortName: 'ICEC',
    fee: { tuition: 22000, admission: 2000, registration: 1000, lab: 0, books: 2200, uniform: 1500 },
    subjects: ['English', 'Second Language Telugu', 'Civics', 'Economics', 'Commerce', 'Environmental Education', 'Ethics and Human Values']
  },
  {
    code: 'I-MEC',
    name: 'Intermediate 1st Year MEC',
    gradeLabel: '1st Year MEC',
    shortName: 'IMEC',
    fee: { tuition: 24000, admission: 2000, registration: 1000, lab: 1500, books: 2300, uniform: 1500 },
    subjects: ['English', 'Second Language Telugu', 'Mathematics IA', 'Mathematics IB', 'Economics', 'Commerce', 'Environmental Education', 'Ethics and Human Values']
  },
  {
    code: 'II-MPC',
    name: 'Intermediate 2nd Year MPC',
    gradeLabel: '2nd Year MPC',
    shortName: 'IIMPC',
    fee: { tuition: 28000, admission: 0, registration: 1000, lab: 4000, books: 2600, uniform: 1200 },
    subjects: ['English', 'Second Language Telugu', 'Mathematics IIA', 'Mathematics IIB', 'Physics', 'Chemistry']
  },
  {
    code: 'II-BIPC',
    name: 'Intermediate 2nd Year BiPC',
    gradeLabel: '2nd Year BiPC',
    shortName: 'IIBPC',
    fee: { tuition: 30000, admission: 0, registration: 1000, lab: 5000, books: 2600, uniform: 1200 },
    subjects: ['English', 'Second Language Telugu', 'Botany', 'Zoology', 'Physics', 'Chemistry']
  },
  {
    code: 'II-CEC',
    name: 'Intermediate 2nd Year CEC',
    gradeLabel: '2nd Year CEC',
    shortName: 'IICEC',
    fee: { tuition: 24000, admission: 0, registration: 1000, lab: 0, books: 2300, uniform: 1200 },
    subjects: ['English', 'Second Language Telugu', 'Civics', 'Economics', 'Commerce']
  },
  {
    code: 'II-MEC',
    name: 'Intermediate 2nd Year MEC',
    gradeLabel: '2nd Year MEC',
    shortName: 'IIMEC',
    fee: { tuition: 26000, admission: 0, registration: 1000, lab: 1500, books: 2400, uniform: 1200 },
    subjects: ['English', 'Second Language Telugu', 'Mathematics IIA', 'Mathematics IIB', 'Economics', 'Commerce']
  }
];

const TEACHERS = {
  english: {
    firstName: 'Anitha',
    lastName: 'Rao',
    gender: 'Female',
    department: 'Languages',
    designation: 'English Lecturer',
    qualification: 'M.A. English, B.Ed',
    experienceYears: 9,
    salary: 42000
  },
  telugu: {
    firstName: 'Suresh',
    lastName: 'Babu',
    gender: 'Male',
    department: 'Languages',
    designation: 'Telugu Lecturer',
    qualification: 'M.A. Telugu, B.Ed',
    experienceYears: 11,
    salary: 40000
  },
  mathematics: {
    firstName: 'Kavitha',
    lastName: 'Reddy',
    gender: 'Female',
    department: 'Mathematics',
    designation: 'Mathematics Lecturer',
    qualification: 'M.Sc Mathematics, B.Ed',
    experienceYears: 10,
    salary: 46000
  },
  physics: {
    firstName: 'Naveen',
    lastName: 'Kumar',
    gender: 'Male',
    department: 'Science',
    designation: 'Physics Lecturer',
    qualification: 'M.Sc Physics, B.Ed',
    experienceYears: 8,
    salary: 45000
  },
  chemistry: {
    firstName: 'Lakshmi',
    lastName: 'Priya',
    gender: 'Female',
    department: 'Science',
    designation: 'Chemistry Lecturer',
    qualification: 'M.Sc Chemistry, B.Ed',
    experienceYears: 8,
    salary: 45000
  },
  botany: {
    firstName: 'Prasad',
    lastName: 'Rao',
    gender: 'Male',
    department: 'Life Sciences',
    designation: 'Botany Lecturer',
    qualification: 'M.Sc Botany, B.Ed',
    experienceYears: 12,
    salary: 44000
  },
  zoology: {
    firstName: 'Nirmala',
    lastName: 'Devi',
    gender: 'Female',
    department: 'Life Sciences',
    designation: 'Zoology Lecturer',
    qualification: 'M.Sc Zoology, B.Ed',
    experienceYears: 10,
    salary: 44000
  },
  civics: {
    firstName: 'Ramesh',
    lastName: 'Chandra',
    gender: 'Male',
    department: 'Humanities',
    designation: 'Civics Lecturer',
    qualification: 'M.A. Political Science, B.Ed',
    experienceYears: 9,
    salary: 41000
  },
  economics: {
    firstName: 'Meena',
    lastName: 'Kumari',
    gender: 'Female',
    department: 'Commerce',
    designation: 'Economics Lecturer',
    qualification: 'M.A. Economics, B.Ed',
    experienceYears: 7,
    salary: 41000
  },
  commerce: {
    firstName: 'Vijay',
    lastName: 'Kumar',
    gender: 'Male',
    department: 'Commerce',
    designation: 'Commerce Lecturer',
    qualification: 'M.Com, B.Ed',
    experienceYears: 8,
    salary: 42000
  },
  values: {
    firstName: 'Asha',
    lastName: 'Rani',
    gender: 'Female',
    department: 'Foundation',
    designation: 'Foundation Lecturer',
    qualification: 'M.A., B.Ed',
    experienceYears: 6,
    salary: 36000
  }
};

const SUBJECT_TEACHER_KEYS = {
  English: 'english',
  'Second Language Telugu': 'telugu',
  'Mathematics IA': 'mathematics',
  'Mathematics IB': 'mathematics',
  'Mathematics IIA': 'mathematics',
  'Mathematics IIB': 'mathematics',
  Physics: 'physics',
  Chemistry: 'chemistry',
  Botany: 'botany',
  Zoology: 'zoology',
  Civics: 'civics',
  Economics: 'economics',
  Commerce: 'commerce',
  'Environmental Education': 'values',
  'Ethics and Human Values': 'values'
};

const STUDENT_FIRST_NAMES = [
  ['Aarav', 'Male'],
  ['Bhavya', 'Female'],
  ['Charan', 'Male'],
  ['Divya', 'Female'],
  ['Eshwar', 'Male'],
  ['Farha', 'Female'],
  ['Ganesh', 'Male'],
  ['Harika', 'Female'],
  ['Ishan', 'Male'],
  ['Jyothi', 'Female'],
  ['Kiran', 'Male'],
  ['Lasya', 'Female'],
  ['Manoj', 'Male'],
  ['Nandini', 'Female'],
  ['Omkar', 'Male'],
  ['Pavani', 'Female'],
  ['Rahul', 'Male'],
  ['Sahithi', 'Female'],
  ['Tarun', 'Male'],
  ['Vaishnavi', 'Female'],
  ['Yashwanth', 'Male'],
  ['Anjali', 'Female'],
  ['Deepak', 'Male'],
  ['Keerthi', 'Female']
];

const LAST_NAMES = ['Reddy', 'Kumar', 'Naidu', 'Rao', 'Varma', 'Basha', 'Prasad', 'Goud', 'Sharma', 'Khan', 'Chowdary', 'Yadav'];
const FATHER_NAMES = ['Srinivas', 'Ramesh', 'Prakash', 'Madhusudan', 'Mahesh', 'Venkatesh', 'Nagaraju', 'Suresh', 'Koteswara Rao', 'Brahmaiah'];
const MOTHER_NAMES = ['Lakshmi', 'Padma', 'Sujatha', 'Anitha', 'Madhavi', 'Sailaja', 'Rani', 'Durga', 'Kavitha', 'Meenakshi'];
const VILLAGES = ['Darsi', 'Kurichedu', 'Podili Road', 'Addanki Road', 'Vemula', 'Siva Raj Nagar', 'D.V.S. Nagar', 'Jamukuladinne'];

function parseArgs(argv) {
  const options = {
    clientId: DEFAULT_CLIENT_ID,
    academicYear: DEFAULT_ACADEMIC_YEAR,
    commit: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--client-id' && next) {
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

  if (!Number.isInteger(options.clientId) || options.clientId <= 0) {
    throw new Error('Pass a valid positive --client-id value.');
  }

  return options;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/seed-intermediate-college-demo.js [--client-id 25] [--academic-year 2026-27] [--commit]

Default mode is a dry-run. Add --commit to insert demo intermediate-college groups, sections, subjects, lecturers, students, and fee records.
`);
}

function dbConfig() {
  return {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_SCHOOL_DATABASE || process.env.DB_DATABASE || 'school',
    port: process.env.DB_PORT || 3306,
    timezone: '+05:30'
  };
}

function escapeIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``;
}

function table(database, name) {
  return `${escapeIdentifier(database)}.${escapeIdentifier(name)}`;
}

function makeStats() {
  return {
    classrooms: { existing: 0, created: 0 },
    sections: { existing: 0, created: 0 },
    subjects: { existing: 0, created: 0 },
    teachers: { existing: 0, created: 0 },
    teacherSubjects: { existing: 0, created: 0 },
    teacherAssignments: { existing: 0, created: 0 },
    students: { existing: 0, created: 0 },
    feeRecords: { existing: 0, created: 0 }
  };
}

function flattenStats(stats) {
  return Object.fromEntries(
    Object.entries(stats).map(([key, value]) => [key, `${value.created} new / ${value.existing} existing`])
  );
}

function totalFee(group) {
  return Object.values(group.fee).reduce((sum, value) => sum + Number(value || 0), 0);
}

function shortYear(academicYear) {
  return String(academicYear).replace(/\D/g, '').slice(-4) || '2627';
}

function virtualId(counter) {
  return -counter;
}

async function findOne(connection, sql, values) {
  const [rows] = await connection.query(sql, values);
  return rows[0] || null;
}

async function ensureClient(connection, database, clientId) {
  const client = await findOne(
    connection,
    `SELECT client_id FROM ${table(database, 'client_master')} WHERE client_id = ? LIMIT 1`,
    [clientId]
  );

  if (!client) {
    throw new Error(`Client ${clientId} was not found in client_master.`);
  }
}

async function ensureClassroom(connection, database, options, stats, group, serial) {
  const existing = await findOne(
    connection,
    `SELECT classroom_id FROM ${table(database, 'classrooms')} WHERE client_id = ? AND LOWER(name) = LOWER(?) LIMIT 1`,
    [options.clientId, group.name]
  );

  if (existing) {
    stats.classrooms.existing += 1;
    return Number(existing.classroom_id);
  }

  stats.classrooms.created += 1;
  if (!options.commit) {
    return virtualId(serial);
  }

  const [result] = await connection.query(`INSERT INTO ${table(database, 'classrooms')} SET ?`, {
    client_id: options.clientId,
    name: group.name,
    capacity: 60,
    facilities: 'Lecture room, blackboard, projector, demo data'
  });
  return result.insertId;
}

async function ensureSection(connection, database, options, stats, classroomId, serial) {
  if (classroomId > 0) {
    const existing = await findOne(
      connection,
      `SELECT section_id FROM ${table(database, 'sections')} WHERE client_id = ? AND classroom_id = ? AND section_name = ? LIMIT 1`,
      [options.clientId, classroomId, DEFAULT_SECTION]
    );

    if (existing) {
      stats.sections.existing += 1;
      return Number(existing.section_id);
    }
  }

  stats.sections.created += 1;
  if (!options.commit) {
    return virtualId(serial);
  }

  const [result] = await connection.query(`INSERT INTO ${table(database, 'sections')} SET ?`, {
    client_id: options.clientId,
    classroom_id: classroomId,
    section_name: DEFAULT_SECTION
  });
  return result.insertId;
}

function teacherKeyForSubject(subjectName) {
  return SUBJECT_TEACHER_KEYS[subjectName] || 'values';
}

function subjectsForTeacherKey(key) {
  return Object.entries(SUBJECT_TEACHER_KEYS)
    .filter(([, teacherKey]) => teacherKey === key)
    .map(([subjectName]) => subjectName)
    .join(', ');
}

async function ensureTeacher(connection, database, options, stats, key, serial) {
  const teacher = TEACHERS[key];
  const email = `demo.${key}.${options.clientId}@ttschool.local`;
  const existing = await findOne(
    connection,
    `SELECT teacher_id FROM ${table(database, 'teachers')} WHERE email = ? LIMIT 1`,
    [email]
  );

  if (existing) {
    stats.teachers.existing += 1;
    return Number(existing.teacher_id);
  }

  stats.teachers.created += 1;
  if (!options.commit) {
    return virtualId(serial);
  }

  const [result] = await connection.query(`INSERT INTO ${table(database, 'teachers')} SET ?`, {
    client_id: options.clientId,
    first_name: teacher.firstName,
    middle_name: null,
    last_name: teacher.lastName,
    date_of_birth: '1990-01-01',
    gender: teacher.gender,
    nationality: 'Indian',
    religion: null,
    phone_number: `98${String(options.clientId).padStart(2, '0')}${String(100000 + serial).slice(-6)}`,
    alternate_phone: null,
    email,
    address_line1: 'Darsi',
    address_line2: null,
    city: 'Darsi',
    state: 'Andhra Pradesh',
    postal_code: '523247',
    country: 'India',
    date_of_joining: '2026-06-01',
    employment_status: 'Active',
    department: teacher.department,
    designation: teacher.designation,
    qualification: teacher.qualification,
    experience_years: teacher.experienceYears,
    subjects_taught: subjectsForTeacherKey(key),
    salary: teacher.salary,
    bank_account_number: null,
    ifsc_code: null,
    achievements: 'Demo intermediate college faculty'
  });
  return result.insertId;
}

async function ensureSubject(connection, database, options, stats, classroomId, subjectName, serial) {
  if (classroomId > 0) {
    const existing = await findOne(
      connection,
      `SELECT subject_id FROM ${table(database, 'subjects')} WHERE client_id = ? AND classroom_id = ? AND LOWER(sub_name) = LOWER(?) LIMIT 1`,
      [options.clientId, classroomId, subjectName]
    );

    if (existing) {
      stats.subjects.existing += 1;
      return Number(existing.subject_id);
    }
  }

  stats.subjects.created += 1;
  if (!options.commit) {
    return virtualId(serial);
  }

  const [result] = await connection.query(`INSERT INTO ${table(database, 'subjects')} SET ?`, {
    client_id: options.clientId,
    classroom_id: classroomId,
    sub_name: subjectName,
    marks: 100
  });
  return result.insertId;
}

async function ensureTeacherSubject(connection, database, options, stats, teacherId, subjectId) {
  if (teacherId > 0 && subjectId > 0) {
    const existing = await findOne(
      connection,
      `SELECT id FROM ${table(database, 'teacher_subjects')} WHERE teacher_id = ? AND subject_id = ? LIMIT 1`,
      [teacherId, subjectId]
    );

    if (existing) {
      stats.teacherSubjects.existing += 1;
      return;
    }
  }

  stats.teacherSubjects.created += 1;
  if (!options.commit) {
    return;
  }

  await connection.query(`INSERT INTO ${table(database, 'teacher_subjects')} SET ?`, {
    client_id: options.clientId,
    teacher_id: teacherId,
    subject_id: subjectId
  });
}

async function ensureTeacherAssignment(connection, database, options, stats, classroomId, sectionId, subjectId, teacherId) {
  if (classroomId > 0 && sectionId > 0 && subjectId > 0) {
    const existing = await findOne(
      connection,
      `SELECT assignment_id FROM ${table(database, 'teacher_subject_assignments')} WHERE classroom_id = ? AND section_id = ? AND subject_id = ? LIMIT 1`,
      [classroomId, sectionId, subjectId]
    );

    if (existing) {
      stats.teacherAssignments.existing += 1;
      return;
    }
  }

  stats.teacherAssignments.created += 1;
  if (!options.commit) {
    return;
  }

  await connection.query(`INSERT INTO ${table(database, 'teacher_subject_assignments')} SET ?`, {
    client_id: options.clientId,
    classroom_id: classroomId,
    section_id: sectionId,
    subject_id: subjectId,
    teacher_id: teacherId,
    status: 'Active'
  });
}

function buildStudent(group, groupIndex, rollNumber, options) {
  const seed = groupIndex * 10 + rollNumber - 1;
  const [firstName, gender] = STUDENT_FIRST_NAMES[seed % STUDENT_FIRST_NAMES.length];
  const lastName = LAST_NAMES[seed % LAST_NAMES.length];
  const father = FATHER_NAMES[seed % FATHER_NAMES.length];
  const mother = MOTHER_NAMES[seed % MOTHER_NAMES.length];
  const village = VILLAGES[seed % VILLAGES.length];
  const birthYear = group.code.startsWith('II') ? 2009 : 2010;
  const roll = String(rollNumber).padStart(3, '0');
  const yearCode = shortYear(options.academicYear);

  return {
    admission_number: `IC${options.clientId}-${group.shortName}-${roll}-${yearCode}`,
    first_name: firstName,
    middle_name: null,
    last_name: lastName,
    date_of_birth: `${birthYear}-${String((seed % 12) + 1).padStart(2, '0')}-${String((seed % 27) + 1).padStart(2, '0')}`,
    gender,
    phone_number: `9${String(options.clientId).padStart(2, '0')}${String(7000000 + seed).slice(-7)}`,
    father_name: `${father} ${lastName}`,
    father_contact: `9${String(options.clientId).padStart(2, '0')}${String(7100000 + seed).slice(-7)}`,
    mother_name: `${mother} ${lastName}`,
    mother_contact: `9${String(options.clientId).padStart(2, '0')}${String(7200000 + seed).slice(-7)}`,
    guardian_name: `${father} ${lastName}`,
    guardian_contact: `9${String(options.clientId).padStart(2, '0')}${String(7100000 + seed).slice(-7)}`,
    address: village,
    roll_number: rollNumber
  };
}

async function ensureStudent(connection, database, options, stats, group, groupIndex, classroomId, rollNumber, serial) {
  const student = buildStudent(group, groupIndex, rollNumber, options);
  const existing = await findOne(
    connection,
    `SELECT student_id FROM ${table(database, 'students')} WHERE admission_number = ? LIMIT 1`,
    [student.admission_number]
  );

  if (existing) {
    stats.students.existing += 1;
    return Number(existing.student_id);
  }

  stats.students.created += 1;
  if (!options.commit) {
    return virtualId(serial);
  }

  const [result] = await connection.query(`INSERT INTO ${table(database, 'students')} SET ?`, {
    client_id: options.clientId,
    yearly_fee: String(totalFee(group)),
    admission_number: student.admission_number,
    first_name: student.first_name,
    middle_name: student.middle_name,
    last_name: student.last_name,
    class_name: classroomId,
    date_of_birth: student.date_of_birth,
    gender: student.gender,
    blood_group: null,
    nationality: 'Indian',
    religion: null,
    transport_id: null,
    pickupPoint: null,
    address_line1: student.address,
    address_line2: null,
    city: 'Darsi',
    state: 'Andhra Pradesh',
    postal_code: '523247',
    country: 'India',
    phone_number: student.phone_number,
    alternate_phone: null,
    email: null,
    emergency_contact_name: student.father_name,
    emergency_contact_relation: 'Father',
    emergency_contact_number: student.father_contact,
    admission_date: '2026-06-10',
    enrollment_status: 'Active',
    grade_level: group.gradeLabel,
    section: DEFAULT_SECTION,
    roll_number: student.roll_number,
    academic_year: options.academicYear,
    father_name: student.father_name,
    father_occupation: 'Parent',
    father_contact: student.father_contact,
    mother_name: student.mother_name,
    mother_occupation: 'Parent',
    mother_contact: student.mother_contact,
    guardian_name: student.guardian_name,
    guardian_relation: 'Father',
    guardian_contact: student.guardian_contact,
    current_grade: group.gradeLabel,
    previous_school: 'Demo High School',
    marks_obtained: null,
    allergies: null,
    medical_conditions: null,
    vaccination_status: 'Completed',
    total_days_present: 0,
    total_days_absent: 0,
    club_membership: null,
    sports_participation: null,
    achievements: 'Demo intermediate college student'
  });
  return result.insertId;
}

async function ensureFeeRecord(connection, database, options, stats, group, studentId, classroomId, rollNumber) {
  if (studentId > 0) {
    const existing = await findOne(
      connection,
      `SELECT fee_id FROM ${table(database, 'fee_records')} WHERE student_id = ? AND fee_year = ? LIMIT 1`,
      [studentId, options.academicYear]
    );

    if (existing) {
      stats.feeRecords.existing += 1;
      return;
    }
  }

  stats.feeRecords.created += 1;
  if (!options.commit) {
    return;
  }

  const total = totalFee(group);
  await connection.query(`INSERT INTO ${table(database, 'fee_records')} SET ?`, {
    client_id: options.clientId,
    fee_reg_no: `F${options.clientId}${group.shortName}${String(rollNumber).padStart(2, '0')}`.slice(0, 20),
    student_id: studentId,
    classroom_id: classroomId,
    fee_year: options.academicYear,
    monthly_fee: group.fee.tuition,
    admission_fee: group.fee.admission,
    registration_fee: group.fee.registration,
    art_material: group.fee.lab,
    transport: 0,
    hostel_fee: 0,
    books: group.fee.books,
    uniform: group.fee.uniform,
    fine: 0,
    others: 0,
    previous_balance: 0,
    discount: 0,
    total,
    deposit: 0,
    due_balance: total
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const config = dbConfig();
  const database = config.database;
  const connection = await mysql.createConnection(config);
  const stats = makeStats();
  const teacherIds = new Map();
  let serial = 1;

  try {
    await ensureClient(connection, database, options.clientId);

    const teacherKeys = [...new Set(Object.values(SUBJECT_TEACHER_KEYS))];
    for (const key of teacherKeys) {
      teacherIds.set(key, await ensureTeacher(connection, database, options, stats, key, serial));
      serial += 1;
    }

    for (let groupIndex = 0; groupIndex < GROUPS.length; groupIndex += 1) {
      const group = GROUPS[groupIndex];
      const classroomId = await ensureClassroom(connection, database, options, stats, group, serial);
      serial += 1;
      const sectionId = await ensureSection(connection, database, options, stats, classroomId, serial);
      serial += 1;

      for (const subjectName of group.subjects) {
        const subjectId = await ensureSubject(connection, database, options, stats, classroomId, subjectName, serial);
        serial += 1;
        const teacherId = teacherIds.get(teacherKeyForSubject(subjectName));
        await ensureTeacherSubject(connection, database, options, stats, teacherId, subjectId);
        await ensureTeacherAssignment(connection, database, options, stats, classroomId, sectionId, subjectId, teacherId);
      }

      for (let rollNumber = 1; rollNumber <= 10; rollNumber += 1) {
        const studentId = await ensureStudent(connection, database, options, stats, group, groupIndex, classroomId, rollNumber, serial);
        serial += 1;
        await ensureFeeRecord(connection, database, options, stats, group, studentId, classroomId, rollNumber);
      }
    }

    console.log(options.commit ? 'Seed committed.' : 'Dry-run only. Add --commit to insert these rows.');
    console.log(JSON.stringify({
      clientId: options.clientId,
      academicYear: options.academicYear,
      groups: GROUPS.map((group) => ({
        name: group.name,
        students: 10,
        subjects: group.subjects.length,
        annualFee: totalFee(group)
      })),
      stats: flattenStats(stats)
    }, null, 2));
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
