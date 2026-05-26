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

const handleError = function(status,message,res){
    res.send({
        "code": status,
        "failed": message
    })
}

module.exports = {
    checkToken,
    decodetoken,
    handleError
}
