#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const outputPath = path.join(
  __dirname,
  '..',
  '..',
  'school_angular',
  'public',
  'templates',
  'student-import-sample.xlsx'
);

const headers = [
  'Sl No',
  'Register No',
  'Admission No',
  'Admission Number',
  'Username',
  'Full Name',
  'First Name',
  'Last Name',
  'Class',
  'Section',
  'Gender',
  'Date of Birth',
  'Admission Date',
  'Father Name',
  'Mother Name',
  'Phone',
  'Alternative Phone 1',
  'Alternative Phone 2',
  'Email',
  'Address',
  'Village',
  'State',
  'Country',
  'Blood Group',
  'Religion',
  'Caste',
  'Sub Caste',
  'Student Type',
  'Medium',
  'Mother Tongue',
  'Active Status'
];

const exampleRows = [
  [
    1,
    'REG-001',
    'ADM-001',
    '',
    'student001',
    'Ananya Reddy',
    'Ananya',
    'Reddy',
    'Nursery',
    'A',
    'Female',
    '10-05-2021',
    '12-06-2026',
    'Ramesh Reddy',
    'Lakshmi Reddy',
    '9876543210',
    '9876500001',
    '',
    'ananya.parent@example.com',
    '12 School Road',
    'Darsi',
    'Andhra Pradesh',
    'India',
    'O+',
    'Hindu',
    '',
    '',
    'Day Scholar',
    'English',
    'Telugu',
    'Active'
  ],
  [
    2,
    'REG-002',
    'ADM-002',
    '',
    'student002',
    'Karthik Kumar',
    'Karthik',
    'Kumar',
    'LKG',
    'A',
    'Male',
    '18-09-2020',
    '12-06-2026',
    'Suresh Kumar',
    'Padma Kumar',
    '9876543211',
    '',
    '',
    'karthik.parent@example.com',
    '45 Temple Street',
    'Darsi',
    'Andhra Pradesh',
    'India',
    'A+',
    'Hindu',
    '',
    '',
    'Day Scholar',
    'English',
    'Telugu',
    'Active'
  ],
  [
    3,
    'REG-003',
    'ADM-003',
    '',
    'student003',
    'Meena Devi',
    'Meena',
    'Devi',
    '1',
    'B',
    'Female',
    '02-01-2019',
    '12-06-2026',
    'Nagaraju',
    'Sita',
    '9876543212',
    '9876500002',
    '',
    'meena.parent@example.com',
    'Main Bazaar',
    'Darsi',
    'Andhra Pradesh',
    'India',
    'B+',
    'Hindu',
    '',
    '',
    'Day Scholar',
    'English',
    'Telugu',
    'Active'
  ],
  [
    4,
    'REG-004',
    'ADM-004',
    '',
    'student004',
    'Sai Charan',
    'Sai',
    'Charan',
    'UKG',
    'A',
    'Male',
    '15-03-2020',
    '12-06-2026',
    'Prasad Rao',
    'Madhavi',
    '9876543213',
    '9876500003',
    '',
    'sai.parent@example.com',
    'Gandhi Nagar',
    'Darsi',
    'Andhra Pradesh',
    'India',
    'AB+',
    'Hindu',
    '',
    '',
    'Day Scholar',
    'English',
    'Telugu',
    'Active'
  ],
  [
    5,
    'REG-005',
    'ADM-005',
    '',
    'student005',
    'Ayesha Begum',
    'Ayesha',
    'Begum',
    '2',
    'B',
    'Female',
    '28-11-2018',
    '12-06-2026',
    'Imran Khan',
    'Sameera Begum',
    '9876543214',
    '',
    '9876500004',
    'ayesha.parent@example.com',
    'Market Road',
    'Darsi',
    'Andhra Pradesh',
    'India',
    'O-',
    'Muslim',
    '',
    '',
    'Day Scholar',
    'English',
    'Urdu',
    'Active'
  ]
];

const guideRows = [
  ['Column', 'Required', 'Example', 'Notes'],
  ['Class', 'Yes', 'Nursery, LKG, UKG, 1, 2, 10', 'Creates the classroom if it does not already exist for the client.'],
  ['Section', 'Recommended', 'A', 'Defaults to A when blank. Creates the section if missing.'],
  ['Full Name', 'Yes if First Name is blank', 'Ananya Reddy', 'Used to split first, middle, and last name.'],
  ['First Name', 'Yes if Full Name is blank', 'Ananya', 'Takes priority over Full Name for first name.'],
  ['Last Name', 'Optional', 'Reddy', 'Takes priority over Full Name for last name.'],
  ['Register No / Admission No / Admission Number / Username', 'Recommended', 'REG-001', 'Used to match existing students during update.'],
  ['Gender', 'Optional', 'Male or Female', 'M, Male, F, and Female are accepted. Blank becomes Other.'],
  ['Date of Birth', 'Recommended', '10-05-2021', 'Use dd-mm-yyyy or dd/mm/yyyy. Blank defaults to 1970-01-01.'],
  ['Admission Date', 'Optional', '12-06-2026', 'Use dd-mm-yyyy or dd/mm/yyyy. Blank defaults to today.'],
  ['Phone', 'Optional', '9876543210', 'Digits are kept for student, father, guardian, and emergency contact.'],
  ['Alternative Phone 1 / Alternative Phone 2', 'Optional', '9876500001', 'Used as alternate phone and mother contact.'],
  ['Active Status', 'Optional', 'Active', 'Accepted values: Active, Inactive, Alumni. Blank becomes Active.'],
  ['Country', 'Optional', 'India', 'India sets nationality to Indian.'],
  ['Blood Group', 'Optional', 'O+', 'Use common blood group values, or leave blank.'],
  ['Other columns', 'Optional', 'Religion, Caste, Medium', 'Stored where matching fields exist, or kept in source notes.']
];

function addSheet(workbook, name, rows, columnWidths) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = columnWidths.map((width) => ({ wch: width }));
  XLSX.utils.book_append_sheet(workbook, sheet, name);
  return sheet;
}

const workbook = XLSX.utils.book_new();

addSheet(
  workbook,
  'Students - Fill Here',
  [headers],
  [8, 14, 14, 18, 14, 24, 16, 16, 12, 10, 12, 16, 16, 20, 20, 14, 20, 20, 28, 24, 16, 18, 12, 12, 14, 14, 14, 16, 12, 18, 14]
);

addSheet(
  workbook,
  'Example Rows',
  [headers, ...exampleRows],
  [8, 14, 14, 18, 14, 24, 16, 16, 12, 10, 12, 16, 16, 20, 20, 14, 20, 20, 28, 24, 16, 18, 12, 12, 14, 14, 14, 16, 12, 18, 14]
);

addSheet(
  workbook,
  'Column Guide',
  guideRows,
  [24, 18, 28, 72]
);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
XLSX.writeFile(workbook, outputPath);

console.log(`Wrote ${outputPath}`);
