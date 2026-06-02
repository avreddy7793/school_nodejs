const express = require('express');
const settings = require('./settings');

const router = express.Router();

router.get('/branding', settings.getSchoolBranding);
router.put('/branding', settings.updateSchoolBranding);

module.exports = router;
