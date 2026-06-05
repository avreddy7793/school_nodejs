const express = require('express');
const settings = require('./settings');

const router = express.Router();

router.get('/branding', settings.getSchoolBranding);
router.put('/branding', settings.updateSchoolBranding);
router.get('/academic-calendar', settings.getAcademicCalendar);
router.put('/academic-calendar', settings.updateAcademicCalendar);

module.exports = router;
