const connection = require('./config.js');
const secret = connection.secret;
let jwt = require('jsonwebtoken');


const decodetoken = (req,res) => {
    return new Promise((resolve,reject) => {
        let token = req.headers['x-access-token'] || req.headers['authorization'];
        if (!token) {
            reject('Token is not supplied');
            return;
        }
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length);

        }
        if (token){
            jwt.verify(token,secret,(err,decoded) => {
                if(err) {
                    reject('Token is not valid');
                } else {
                    res.decoded = decoded
                    resolve(res.decoded.clientid);
                }
            });
        }
    })
}

const checkToken = (req,res,next) => {
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    if (token && token.startsWith('Bearer ')) {
        token = token.slice(7, token.length);
    }
    if (token) {
        jwt.verify(token,secret,(err,decoded) => {
            if (err) {
                return res.json({
                    success : false,
                    message : 'Token is not valid'
                });
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        return res.json({
            success : false,
            message : 'Just token is not supplied'
        });
    }
};

function isClientManagementPath(req) {
    const values = [req.path, req.url, req.originalUrl]
        .map((value) => String(value || '').split('?')[0].toLowerCase());
    return values.some((path) =>
        path === '/clients' ||
        path.startsWith('/clients/') ||
        path === '/school/clients' ||
        path.startsWith('/school/clients/') ||
        path === '/api/clients' ||
        path.startsWith('/api/clients/') ||
        path === '/api/school/clients' ||
        path.startsWith('/api/school/clients/')
    );
}

function normalizePositiveInteger(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function applyClientIdToBody(body, clientId) {
    if (!body) {
        return;
    }

    if (Array.isArray(body)) {
        body.forEach((item) => applyClientIdToBody(item, clientId));
        return;
    }

    if (typeof body === 'object' && !Buffer.isBuffer(body)) {
        body.client_id = clientId;
        body.clientId = clientId;
    }
}

const enforceClientScope = (req, res, next) => {
    const decoded = req.decoded || {};

    if (isClientManagementPath(req)) {
        return next();
    }

    const clientId = normalizePositiveInteger(decoded.client_id || decoded.clientId || decoded.clientid);
    if (!clientId) {
        return res.status(403).json({
            success: false,
            message: 'Client scope is required for this request'
        });
    }

    req.scopedClientId = clientId;
    req.query.client_id = String(clientId);
    req.query.clientId = String(clientId);
    applyClientIdToBody(req.body, clientId);

    return next();
};

const handleError = function(status,message,res){
    res.send({
        "code": status,
        "failed": message
    })
}

module.exports = {
    checkToken,
    enforceClientScope,
    decodetoken,
    handleError
}
