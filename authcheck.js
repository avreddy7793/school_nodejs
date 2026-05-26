var jwt = require('jsonwebtoken');
var secret = "global_developers_working";

module.exports = {
    checktoken(req, res, next) {
        if (!req.headers.authorization) {
            return res.json({ statsu: 500, message: " Please pass the token " })
        }
        try{
            const token = req.headers.authorization;
            const decoded = jwt.verify(token, secret);
            if (token.startsWith('Bearer')) {
                token = token.slice(7,token.length);
                console.log(token)
            }
            next();
        }catch(error){
            return res.json({ statsu: 401, message: " Authorization Failed " })
        }
    }
}