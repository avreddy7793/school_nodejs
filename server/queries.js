const globalDatabase = process.env.DB_GLOBAL_DATABASE || process.env.DB_DATABASE || 'global';
const schoolDatabase = process.env.DB_SCHOOL_DATABASE || 'school';

const loginTable = table('login');
const clientCategoryTable = table('client_category');
const clientMasterTable = table('client_master');
const employeesTable = table('employess');
const rolesTable = table('roles');
const userEntityLinksTable = schoolTable('user_entity_links');

function table(name) {
    return `${escapeIdentifier(globalDatabase)}.${escapeIdentifier(name)}`;
}

function schoolTable(name) {
    return `${escapeIdentifier(schoolDatabase)}.${escapeIdentifier(name)}`;
}

function escapeIdentifier(value) {
    return `\`${String(value).replace(/`/g, '``')}\``;
}

let login = `SELECT 
    l.login_id, 
    l.login_email, 
    l.login_name, 
    l.login_designation, 
    l.login_type, 
    l.passkey, 
    l.salt, 
    cm.client_name, 
    l.client_id AS client_id, 
    cc.name AS category, 
    l.category AS category_id, 
    l.last_login, 
    l.create_date, 
    l.update_date, 
    e.emp_name, 
    l.status, 
    l.role, 
    r.role_name,
    l.branch_id, 
    l.emp_id,
    uel.entity_type,
    uel.entity_id
FROM ${loginTable} l
LEFT JOIN ${clientCategoryTable} cc ON l.category = cc.id
LEFT JOIN ${clientMasterTable} cm ON l.client_id = cm.client_id
LEFT JOIN ${employeesTable} e ON l.emp_id = e.emp_id
LEFT JOIN ${rolesTable} r ON l.role = r.id
LEFT JOIN ${userEntityLinksTable} uel ON uel.login_id = l.login_id AND uel.status = 'ACTIVE'
WHERE l.login_email = (?);`;
let getProfile = `select * from ${loginTable} where login_id = ?`;
let alluserslist = `select * from ${loginTable} order by update_date desc`;
let updateLastLogin = `UPDATE ${loginTable} SET last_login=CURRENT_TIMESTAMP where login_id= ?`;

module.exports = {
    login,
    getProfile,
    alluserslist,
    updateLastLogin
}
