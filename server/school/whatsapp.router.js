const express = require('express');
const whatsapp = require('./whatsapp');

const router = express.Router();

router.get('/config', whatsapp.getConfig);
router.put('/config', whatsapp.updateConfig);
router.post('/test', whatsapp.testMessage);
router.get('/messages', whatsapp.listMessages);

module.exports = router;
