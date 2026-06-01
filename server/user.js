const {pool} = require('./config.js');
const connection = require('./config.js');
let jwt = require('jsonwebtoken');
const dbquery = require('./queries.js');
const api = require('./api');
const secret = connection.secret;
const wbm = require('wbm');

const handleError = function (status, message, res) {
    res.send({
        "code": status,
        "message": message
    })
}

const login = (req, res) => {
    let login_email = req.body.login_email;
    let passkey = req.body.passkey;
    if (login_email && passkey) {
        pool.query(dbquery.login, [login_email], (error, results) => {
            if (error) {
                return res.json({ statusCode: 200, message: 'Invalid Email' })
            }
            else {
                if (results.length > 0) {
                    // console.log(results);
                    if (results[0].status == 'ACTIVATED') {
                        let mockedUsername = results[0].login_email;
                        let mockedPassword = results[0].passkey;
                        let login_id = results[0].login_id;
                        let role = results[0].role;
                        let role_name = results[0].role_name;
                        let category = results[0].category;
                        let catgory_id = results[0].category_id
                        let emp_id = results[0].emp_id;
                        let salt = results[0].salt;
                        let client_id = results[0].client_id;
                        let hash = crypto.createHmac('sha512', salt);
                        let branch_id = results[0].branch_id;
                        let last_login= results[0].last_login;
                        let login_type = results[0].login_type
                        let entity_type = results[0].entity_type;
                        let entity_id = results[0].entity_id;
                        let normalized_entity_type = String(entity_type || '').toUpperCase();
                        let teacher_id = normalized_entity_type === 'TEACHER' ? entity_id : null;
                        let staff_id = normalized_entity_type === 'STAFF' ? entity_id : null;
                        hash.update(passkey);
                        let value = hash.digest('hex');
                        if (value === mockedPassword) {
                            let token = jwt.sign({
                                login_email: mockedUsername,
                                login_id: login_id,
                                client_id: client_id,
                                role: role,
                                role_name: role_name,
                                login_type: login_type,
                                category_id: catgory_id,
                                entity_type: entity_type,
                                entity_id: entity_id,
                                teacher_id: teacher_id,
                                staff_id: staff_id
                            },
                                secret,
                                { expiresIn: '168h' }
                            );
                            var loginsql = dbquery.updateLastLogin;
                            pool.query(loginsql, [login_id], (error, results) => {
                                if (error) {
                                    res.send({ status: 400, message: error })
                                }
                            })
                            res.send({
                                "code": 200,
                                success: true,
                                message: 'Welcome to AVR Groups Login successful ',
                                token: token,
                                login_email: mockedUsername,
                                login_id: login_id,
                                role: role,
                                role_name: role_name,
                                roleName: role_name,
                                category: category,
                                emp_id: emp_id,
                                client_id: client_id,
                                branch_id: branch_id,
                                last_login: last_login,
                                login_type : login_type,
                                catgory_id : catgory_id,
                                entity_type: entity_type,
                                entity_id: entity_id,
                                teacher_id: teacher_id,
                                staff_id: staff_id
                            });
                        } else {
                            return res.json({ statusCode: 300, message: "Invalid Password" })
                        }
                    } else {
                        return res.json({ status: 401, message: 'Account ' + results[0].status })
                    }
                }
                else {
                    handleError(403, 'Incorrect username or password', res)
                    return;
                }
            }
        }
        )
    } else {
        handleError(400, 'Authenication failed! Please check the request', res)
        return;
    }
};
const whatsAppMsg = (req, res) => {
wbm.start().then(async () => {
    const phones = [req.body.phone];
    const message = req.body.message;
    await wbm.send(phones, message);
    // await wbm.end();
    res.status(200).json('Msg sent successfully.')
}).catch(err => console.log(err));
}
'use strict';
let crypto = require('crypto');
let loggerencode = func => {
};

let generateSalt = rounds => {
    if (rounds >= 15) {
        throw new Error(`${rounds} is greater than 15,Must be less that 15`);
    }
    if (typeof rounds !== 'number') {
        throw new Error('rounds param must be a number');
    }
    if (rounds == null) {
        rounds = 12;
    }
    return crypto.randomBytes(Math.ceil(rounds / 2)).toString('hex').slice(0, rounds);
};
loggerencode(generateSalt(12))

function hasher(passkey) {
    return new Promise((resolve, reject) => {
        var salt = crypto.randomBytes(Math.ceil(15 / 2)).toString('hex').slice(0, 15);
        let hash = crypto.createHmac('sha512', salt);
        hash.update(passkey);
        let value = hash.digest('hex');
        resolve({
            salt: salt,
            hashedpassword: value
        })
    })
}

let hash = (passkey, salt) => {
    if (passkey == null || salt == null) {
        throw new Error('Must Provide Password and salt values');
    }
    if (typeof passkey !== 'string' || typeof salt !== 'string') {
        throw new Error('password must be a string and salt must either be a salt string or a number of rounds');
    }
    return hasher(passkey, salt);
};
loggerencode(hash('Wisdom', generateSalt(12)))


let compare = (passkey, hash) => {
    hash = {
        salt: 'f844b09ff50c',
        hashedpassword: '2d2528d4534394d1e2702f53826d11c16ed4422f6bd466745cb4f1aa0e042b52b98fc5e65b86d73a6ce4807679b773fb955c4824b0471015354e1a872d42cb62'
    }
    if (passkey == null || hash == null) {
        throw new Error('password and hash is required to compare');
    }
    if (typeof passkey !== 'string' || typeof hash !== 'object') {
        throw new Error('password must be a String and hash must be an Object');
    }
    let passwordData = hasher(passkey, hash.salt);
    if (passwordData.hashedpassword === hash.hashedpassword) {
        return true;
    }
    return false
};
loggerencode(compare('wisdom'))




module.exports = {
    generateSalt,
    hash,
    compare,
    login,
    whatsAppMsg
}
