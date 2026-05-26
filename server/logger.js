var path = require("path");
var fs = require ("fs");
var appRoot = require("app-root-path");
var winston = require("winston");
var clfDate = require("clf-date");


var logDirecectory = path.resolve(`${appRoot}`, "logs");
fs.existsSync(logDirecectory) || fs.mkdirSync(logDirecectory);

var options = {
    infofile:{
        level: "info",
        filename: path.resolve("info.log"),
        handleExceptions: true,
        json:true,
        maxsize: 5242880, //5 MB
        maxFiles: 5
    },
    errorfile:{
        level: "error",
        filename: path.resolve("error.log"),
        handleExceptions: true,
        json:true,
        maxsize: 5242880, //5 MB
        maxFiles: 5
    }
};

const logger = winston.createLogger({
    transports: [
        new winston.transports.File(options.infofile),
        new winston.transports.File(options.errorfile),
    ]
});

logger.stream = {
    write: function(message,encoding){
        logger.info(message);
    }
};

logger.combinedFormate = function(err, req, res){
    return `${req.ip} - - [${clfDate(
        new Date()
    )}] \"${req.method} ${req.originalUrl} HTTP/${req.httpVersion}\" ${err.status ||
    500} - ${req.headers["user-agent"]}`;
};

module.exports = logger;