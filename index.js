require('custom-env').env('local');
const express = require('express');
const app = express();
var routes = require('./server/routes.js');
const https = require('https');
const fileUpload = require('express-fileupload');
require('dotenv').config();
const cors = require('cors'); // Add this line


// Enable CORS
app.use(cors());

var allowCrossDomain = function (req, response, next) {
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Credentials", "true");
    response.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    response.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Authorization,Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
    next();
}
app.use(express.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(express.json({limit: "50mb"}));
app.use(fileUpload());
app.use(express.static('public'));
app.use(allowCrossDomain);

app.use((req, res, next) => {
    const cleanedUrl = req.url.replace(/(%0A|%0D|\s)+$/gi, '');
    if (cleanedUrl !== req.url) {
        req.url = cleanedUrl || '/';
    }
    next();
});

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Backend is running',
        node: process.version
    });
});

routes(app);

app.listen(process.env.PORT || 3000, () => {
    console.log(`Team Tracker Backend Project Running on port ${process.env.PORT || 3000}.`)
})
