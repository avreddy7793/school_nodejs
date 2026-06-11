function normalizeText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed || null;
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

  return Number.isInteger(startYear) && Number.isInteger(endYear) && endYear > startYear
    ? { startYear, endYear }
    : null;
}

function admissionYearPart(value) {
  const parts = academicYearParts(value);
  if (!parts) {
    return normalizeAdmissionPart(value, 'YEAR');
  }

  return `${parts.startYear}-${String(parts.endYear).slice(-2)}`;
}

function normalizeAdmissionPart(value, fallback) {
  const normalized = normalizeText(value) || fallback;
  return String(normalized)
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9-]+/g, '')
    .slice(0, 18) || fallback;
}

function normalizeClassPart(value) {
  const text = normalizeText(value);
  if (!text) {
    return 'CLASS';
  }

  const upper = text.toUpperCase().replace(/\s+/g, ' ').trim();
  if (upper.includes('NURSERY')) {
    return 'NURSERY';
  }
  if (upper === 'LKG' || upper.includes('LOWER KINDERGARTEN')) {
    return 'LKG';
  }
  if (upper === 'UKG' || upper.includes('UPPER KINDERGARTEN')) {
    return 'UKG';
  }

  return normalizeAdmissionPart(upper, 'CLASS');
}

function buildStudentAdmissionNumber({ academicYear, classroomName, rollNumber }) {
  const classPart = normalizeClassPart(classroomName);
  const rollPart = String(Number(rollNumber) || 0).padStart(3, '0');
  const yearPart = admissionYearPart(academicYear);

  return `${classPart}-${rollPart}-${yearPart}`;
}

module.exports = {
  admissionYearPart,
  buildStudentAdmissionNumber,
  normalizeAdmissionPart,
  normalizeClassPart
};
