const express = require('express');
const portal = require('./portal');

const router = express.Router();

router.get('/summary', portal.getPortalSummary);
router.get('/students/:studentId', portal.getPortalStudent);

module.exports = router;
