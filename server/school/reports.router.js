const express = require('express');
const reports = require('./reports');

const router = express.Router();

router.get('/progress-cards', reports.getProgressCards);
router.post('/progress-cards/whatsapp', reports.sendProgressCardsWhatsapp);
router.get('/operations', reports.getOperationalReports);

module.exports = router;
