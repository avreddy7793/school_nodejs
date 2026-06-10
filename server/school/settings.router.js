const express = require('express');
const db = require('../api');
const settings = require('./settings');

const router = express.Router();

router.get('/branding', settings.getSchoolBranding);
router.put('/branding', settings.updateSchoolBranding);
router.get('/academic-calendar', settings.getAcademicCalendar);
router.put('/academic-calendar', settings.updateAcademicCalendar);
router.get('/academic-year-rollover/preview', settings.previewAcademicYearRollover);
router.post('/academic-year-rollover', settings.applyAcademicYearRollover);
router.put('/password', db.checkToken, settings.changePassword);

module.exports = router;
