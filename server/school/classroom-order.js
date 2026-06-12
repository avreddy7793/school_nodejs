function classNameSortRank(value) {
  const label = String(value || '').trim();
  const normalized = label.toUpperCase();

  if (!normalized) {
    return 9999;
  }

  if (normalized.includes('NURSERY') || normalized.includes('NURSARY')) {
    return 0;
  }

  if (/(^|[^A-Z])LKG([^A-Z]|$)/.test(normalized) || normalized.includes('LOWER KINDERGARTEN')) {
    return 1;
  }

  if (/(^|[^A-Z])UKG([^A-Z]|$)/.test(normalized) || normalized.includes('UPPER KINDERGARTEN')) {
    return 2;
  }

  const numberMatch = normalized.match(/\d+/);
  return numberMatch ? 100 + Number(numberMatch[0]) : 9999;
}

function compareClassNames(first, second) {
  const firstRank = classNameSortRank(first);
  const secondRank = classNameSortRank(second);

  if (firstRank !== secondRank) {
    return firstRank - secondRank;
  }

  return String(first || '').localeCompare(String(second || ''), undefined, {
    numeric: true,
    sensitivity: 'base'
  });
}

function compareClassrooms(first, second) {
  return compareClassNames(
    first?.name || first?.classroom_name,
    second?.name || second?.classroom_name
  );
}

function classroomOrderSql(columnSql) {
  const value = `UPPER(TRIM(COALESCE(${columnSql}, '')))`;
  return `
    CASE
      WHEN ${value} LIKE '%NURSERY%' OR ${value} LIKE '%NURSARY%' THEN 0
      WHEN ${value} REGEXP '(^|[^A-Z])LKG([^A-Z]|$)' OR ${value} LIKE '%LOWER KINDERGARTEN%' THEN 1
      WHEN ${value} REGEXP '(^|[^A-Z])UKG([^A-Z]|$)' OR ${value} LIKE '%UPPER KINDERGARTEN%' THEN 2
      WHEN ${value} REGEXP '[0-9]+' THEN 100 + CAST(REGEXP_SUBSTR(${value}, '[0-9]+') AS UNSIGNED)
      ELSE 9999
    END,
    ${value} ASC
  `;
}

module.exports = {
  classNameSortRank,
  compareClassNames,
  compareClassrooms,
  classroomOrderSql
};
