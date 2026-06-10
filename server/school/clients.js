const crypto = require('crypto');
const { pool } = require('../config');

const schoolDatabase = process.env.DB_SCHOOL_DATABASE || process.env.DB_DATABASE || 'school';
const clientMasterTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('client_master')}`;
const clientCategoryTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('client_category')}`;
const loginTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('login')}`;
const employeesTable = `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier('employess')}`;

function escapeIdentifier(value) {
  return `\`${String(value).replace(/`/g, '``')}\``;
}

function normalizeText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed || null;
}

function normalizePositiveInteger(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
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

function sendDatabaseError(res, error) {
  return res.status(500).json({
    success: false,
    message: 'Database error',
    error: error.message
  });
}

function isPresidentValue(value) {
  const normalized = String(value || '').trim().toUpperCase().replace(/[-_]+/g, ' ');
  return normalized === 'PRESIDENT' || normalized === 'PRESENDENT';
}

async function requirePresident(req, res, next) {
  if (
    isPresidentValue(req.decoded?.login_designation) ||
    isPresidentValue(req.decoded?.role_name) ||
    isPresidentValue(req.decoded?.login_type)
  ) {
    return next();
  }

  const loginId = normalizePositiveInteger(req.decoded?.login_id);
  if (!loginId) {
    return res.status(403).json({
      success: false,
      message: 'President access is required.'
    });
  }

  try {
    const [rows] = await pool.promise().query(
      `SELECT login_designation FROM ${loginTable} WHERE login_id = ? LIMIT 1`,
      [loginId]
    );

    if (isPresidentValue(rows[0]?.login_designation)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'President access is required.'
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

function mapLogin(row, includeTemporaryPassword = false) {
  const login = {
    login_id: Number(row.login_id),
    login_email: row.login_email || '',
    login_name: row.login_name || '',
    login_designation: row.login_designation || '',
    login_type: row.login_type || '',
    status: row.status || '',
    client_id: row.client_id === null || row.client_id === undefined ? null : Number(row.client_id),
    emp_id: row.emp_id === null || row.emp_id === undefined ? null : Number(row.emp_id),
    saved_password: row.password || '',
    last_login: row.last_login || null,
    create_date: row.create_date || null,
    update_date: row.update_date || null
  };

  if (includeTemporaryPassword) {
    login.temporary_password = row.password || '';
  }

  return login;
}

function mapCategory(row) {
  return {
    id: Number(row.id),
    name: row.name || '',
    create_date: row.create_date || null,
    update_date: row.update_date || null,
    client_count: Number(row.client_count || 0)
  };
}

function mapClient(row) {
  return {
    client_id: Number(row.client_id),
    client_name: row.client_name || '',
    client_address: row.client_address || '',
    category: row.category === null || row.category === undefined ? null : Number(row.category),
    category_name: row.category_name || '',
    img: row.img || '',
    owner_name: row.owner_name || '',
    mobile_number: row.mobile_number || '',
    email: row.email || '',
    created_by: row.created_by === null || row.created_by === undefined ? null : Number(row.created_by),
    gdt_number: row.gdt_number || '',
    latitude: row.latitude || '',
    longitude: row.longitude || '',
    create_date: row.create_date || null,
    update_date: row.update_date || null
  };
}

async function clientExists(connection, clientId) {
  const [rows] = await connection.query(
    `SELECT client_id FROM ${clientMasterTable} WHERE client_id = ? LIMIT 1`,
    [clientId]
  );

  return rows.length > 0;
}

async function categoryExists(connection, categoryId) {
  const [rows] = await connection.query(
    `SELECT id FROM ${clientCategoryTable} WHERE id = ? LIMIT 1`,
    [categoryId]
  );

  return rows.length > 0;
}

async function selectClientLogins(connection, clientId) {
  const [rows] = await connection.query(
    `
      SELECT
        login_id,
        login_email,
        login_name,
        login_designation,
        login_type,
        status,
        client_id,
        emp_id,
        password,
        last_login,
        create_date,
        update_date
      FROM ${loginTable}
      WHERE client_id = ?
      ORDER BY update_date DESC, login_id DESC
    `,
    [clientId]
  );

  return rows.map((row) => mapLogin(row));
}

async function createClientAdminEmployee(connection, payload, loginName, email) {
  const employeePayload = {
    emp_name: loginName,
    emp_designation: 'ADMIN',
    emp_type: 'INTERNAL',
    client_id: payload.client_id,
    email,
    status: 'ACTIVATED',
    category: payload.category,
    phone_number: payload.mobile_number || null,
    department: 'Administration',
    created_by: null,
    role: null
  };

  const [result] = await connection.query(`INSERT INTO ${employeesTable} SET ?`, employeePayload);
  return result.insertId;
}

async function createClientAdminLogin(connection, payload, loginOptions) {
  const email = normalizeText(getValue(loginOptions, 'adminLoginEmail', 'admin_login_email'));
  const password = normalizeText(getValue(loginOptions, 'adminLoginPassword', 'admin_login_password'));

  if (!email && !password) {
    return null;
  }

  if (!email || !password) {
    const error = new Error('Client admin email and password are required together.');
    error.statusCode = 400;
    throw error;
  }

  if (password.length < 6) {
    const error = new Error('Client admin password must be at least 6 characters.');
    error.statusCode = 400;
    throw error;
  }

  const [existingRows] = await connection.query(
    `SELECT login_id FROM ${loginTable} WHERE login_email = ? LIMIT 1`,
    [email]
  );

  if (existingRows.length) {
    const error = new Error('A login already exists with this email.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = hashPassword(password);
  const loginName =
    normalizeText(getValue(loginOptions, 'adminLoginName', 'admin_login_name')) ||
    payload.owner_name ||
    payload.client_name;
  const employeeId =
    normalizePositiveInteger(loginOptions.adminEmployeeId) ||
    await createClientAdminEmployee(connection, payload, loginName, email);
  const createdByEmployeeId = normalizePositiveInteger(loginOptions.createdByEmployeeId);

  const loginPayload = {
    login_email: email,
    passkey: passwordHash.passkey,
    salt: passwordHash.salt,
    login_name: loginName,
    login_designation: 'ADMIN',
    login_type: 'INTERNAL',
    client_id: payload.client_id,
    created_by: createdByEmployeeId,
    emp_id: employeeId,
    status: 'ACTIVATED',
    category: payload.category,
    password
  };

  const [result] = await connection.query(`INSERT INTO ${loginTable} SET ?`, loginPayload);
  const [rows] = await connection.query(
    `
      SELECT login_id, login_email, login_name, login_designation, login_type, status, client_id, emp_id, password, last_login, create_date, update_date
      FROM ${loginTable}
      WHERE login_id = ?
      LIMIT 1
    `,
    [result.insertId]
  );

  return rows[0] ? mapLogin(rows[0], true) : null;
}

async function selectClient(connection, clientId) {
  const [rows] = await connection.query(
    `
      SELECT
        cm.client_id,
        cm.client_name,
        cm.client_address,
        cm.category,
        cc.name AS category_name,
        cm.img,
        cm.owner_name,
        cm.mobile_number,
        cm.email,
        cm.created_by,
        cm.gdt_number,
        cm.latitude,
        cm.longitude,
        cm.create_date,
        cm.update_date
      FROM ${clientMasterTable} cm
      LEFT JOIN ${clientCategoryTable} cc ON cc.id = cm.category
      WHERE cm.client_id = ?
      LIMIT 1
    `,
    [clientId]
  );

  return rows[0] ? mapClient(rows[0]) : null;
}

async function getSummary(req, res) {
  try {
    const database = pool.promise();
    const [[clientCount]] = await database.query(`SELECT COUNT(*) AS total FROM ${clientMasterTable}`);
    const [[categoryCount]] = await database.query(`SELECT COUNT(*) AS total FROM ${clientCategoryTable}`);
    const [[loginCount]] = await database.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'ACTIVATED') AS activated
      FROM ${loginTable}
      WHERE client_id IS NOT NULL
    `);
    const [categories] = await database.query(`
      SELECT
        cc.id,
        cc.name,
        COUNT(cm.client_id) AS client_count
      FROM ${clientCategoryTable} cc
      LEFT JOIN ${clientMasterTable} cm ON cm.category = cc.id
      GROUP BY cc.id, cc.name
      ORDER BY client_count DESC, cc.name ASC
      LIMIT 8
    `);
    const [latestClients] = await database.query(`
      SELECT
        cm.client_id,
        cm.client_name,
        cm.owner_name,
        cm.mobile_number,
        cm.email,
        cm.update_date,
        cc.name AS category_name
      FROM ${clientMasterTable} cm
      LEFT JOIN ${clientCategoryTable} cc ON cc.id = cm.category
      ORDER BY cm.create_date DESC, cm.client_id DESC
      LIMIT 6
    `);

    return res.status(200).json({
      success: true,
      data: {
        total_clients: Number(clientCount.total || 0),
        total_categories: Number(categoryCount.total || 0),
        total_logins: Number(loginCount.total || 0),
        activated_logins: Number(loginCount.activated || 0),
        categories: categories.map((row) => ({
          id: Number(row.id),
          name: row.name || '',
          client_count: Number(row.client_count || 0)
        })),
        latest_clients: latestClients.map((row) => ({
          client_id: Number(row.client_id),
          client_name: row.client_name || '',
          owner_name: row.owner_name || '',
          mobile_number: row.mobile_number || '',
          email: row.email || '',
          category_name: row.category_name || '',
          update_date: row.update_date || null
        }))
      }
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function listCategories(req, res) {
  try {
    const [rows] = await pool.promise().query(`
      SELECT
        cc.id,
        cc.name,
        cc.create_date,
        cc.update_date,
        COUNT(cm.client_id) AS client_count
      FROM ${clientCategoryTable} cc
      LEFT JOIN ${clientMasterTable} cm ON cm.category = cc.id
      GROUP BY cc.id, cc.name, cc.create_date, cc.update_date
      ORDER BY cc.name ASC, cc.id ASC
    `);

    return res.status(200).json({
      success: true,
      data: rows.map(mapCategory)
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function createCategory(req, res) {
  const name = normalizeText(getValue(req.body, 'name'));
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Category name is required.'
    });
  }

  try {
    const database = pool.promise();
    const [existingRows] = await database.query(
      `SELECT id, name, create_date, update_date FROM ${clientCategoryTable} WHERE LOWER(name) = LOWER(?) LIMIT 1`,
      [name]
    );

    if (existingRows.length) {
      return res.status(200).json({
        success: true,
        message: 'Category already exists.',
        data: mapCategory({ ...existingRows[0], client_count: 0 })
      });
    }

    const [result] = await database.query(
      `INSERT INTO ${clientCategoryTable} (name) VALUES (?)`,
      [name]
    );

    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: {
        id: result.insertId,
        name
      }
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function listClients(req, res) {
  const categoryId = normalizePositiveInteger(req.query.category_id || req.query.categoryId);
  const search = normalizeText(req.query.search);
  const conditions = [];
  const values = [];

  if (categoryId) {
    conditions.push('cm.category = ?');
    values.push(categoryId);
  }

  if (search) {
    conditions.push(`(
      cm.client_name LIKE ?
      OR cm.owner_name LIKE ?
      OR cm.mobile_number LIKE ?
      OR cm.email LIKE ?
      OR cc.name LIKE ?
    )`);
    const like = `%${search}%`;
    values.push(like, like, like, like, like);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const [rows] = await pool.promise().query(
      `
        SELECT
          cm.client_id,
          cm.client_name,
          cm.client_address,
          cm.category,
          cc.name AS category_name,
          cm.img,
          cm.owner_name,
          cm.mobile_number,
          cm.email,
          cm.created_by,
          cm.gdt_number,
          cm.latitude,
          cm.longitude,
          cm.create_date,
          cm.update_date
        FROM ${clientMasterTable} cm
        LEFT JOIN ${clientCategoryTable} cc ON cc.id = cm.category
        ${whereClause}
        ORDER BY cm.update_date DESC, cm.client_id DESC
      `,
      values
    );

    return res.status(200).json({
      success: true,
      data: rows.map(mapClient)
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function createClient(req, res) {
  const categoryId = normalizePositiveInteger(getValue(req.body, 'categoryId', 'category'));
  const payload = {
    client_name: normalizeText(getValue(req.body, 'clientName', 'client_name')),
    client_address: normalizeText(getValue(req.body, 'clientAddress', 'client_address')),
    category: categoryId,
    img: normalizeText(getValue(req.body, 'logoUrl', 'img')),
    owner_name: normalizeText(getValue(req.body, 'ownerName', 'owner_name')),
    mobile_number: normalizeText(getValue(req.body, 'mobileNumber', 'mobile_number')),
    email: normalizeText(getValue(req.body, 'email')),
    created_by: normalizePositiveInteger(req.decoded?.login_id),
    gdt_number: normalizeText(getValue(req.body, 'gdtNumber', 'gdt_number')),
    latitude: normalizeText(getValue(req.body, 'latitude')),
    longitude: normalizeText(getValue(req.body, 'longitude'))
  };

  if (!payload.client_name || !payload.category) {
    return res.status(400).json({
      success: false,
      message: 'Client name and category are required.'
    });
  }

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    if (!(await categoryExists(connection, payload.category))) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Selected category does not exist.'
      });
    }

    const [result] = await connection.query(`INSERT INTO ${clientMasterTable} SET ?`, payload);
    payload.client_id = result.insertId;
    const client = await selectClient(connection, result.insertId);
    const login = await createClientAdminLogin(connection, payload, {
      ...req.body,
      createdByEmployeeId: req.decoded?.emp_id || req.decoded?.empId || req.decoded?.employee_id
    });

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: login ? 'Client created successfully with admin login.' : 'Client created successfully.',
      data: client,
      login
    });
  } catch (error) {
    await connection.rollback();
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }

    return sendDatabaseError(res, error);
  } finally {
    connection.release();
  }
}

async function listClientLogins(req, res) {
  const clientId = normalizePositiveInteger(req.params.clientId || req.query.client_id);
  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'Client id is required.'
    });
  }

  try {
    const connection = pool.promise();
    if (!(await clientExists(connection, clientId))) {
      return res.status(404).json({
        success: false,
        message: 'Client not found.'
      });
    }

    const logins = await selectClientLogins(connection, clientId);
    return res.status(200).json({
      success: true,
      data: logins
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

async function resetClientLoginPassword(req, res) {
  const clientId = normalizePositiveInteger(req.params.clientId || req.body.clientId || req.body.client_id);
  const loginId = normalizePositiveInteger(req.params.loginId || req.body.loginId || req.body.login_id);
  const newPassword = normalizeText(getValue(req.body, 'newPassword', 'new_password'));
  const confirmPassword = normalizeText(getValue(req.body, 'confirmPassword', 'confirm_password'));

  if (!clientId || !loginId) {
    return res.status(400).json({
      success: false,
      message: 'Client id and login id are required.'
    });
  }

  if (!newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password and confirmation are required.'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters.'
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password and confirmation do not match.'
    });
  }

  try {
    const passwordHash = hashPassword(newPassword);
    const database = pool.promise();
    const [rows] = await database.query(
      `
        SELECT login_id
        FROM ${loginTable}
        WHERE login_id = ? AND client_id = ?
        LIMIT 1
      `,
      [loginId, clientId]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Login account not found for this client.'
      });
    }

    await database.query(
      `
        UPDATE ${loginTable}
        SET passkey = ?, salt = ?, password = ?, status = 'ACTIVATED'
        WHERE login_id = ? AND client_id = ?
      `,
      [passwordHash.passkey, passwordHash.salt, newPassword, loginId, clientId]
    );

    const [updatedRows] = await database.query(
      `
        SELECT login_id, login_email, login_name, login_designation, login_type, status, client_id, emp_id, password, last_login, create_date, update_date
        FROM ${loginTable}
        WHERE login_id = ? AND client_id = ?
        LIMIT 1
      `,
      [loginId, clientId]
    );

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully.',
      data: updatedRows[0] ? mapLogin(updatedRows[0], true) : null
    });
  } catch (error) {
    return sendDatabaseError(res, error);
  }
}

module.exports = {
  requirePresident,
  getSummary,
  listCategories,
  createCategory,
  listClients,
  createClient,
  listClientLogins,
  resetClientLoginPassword
};
