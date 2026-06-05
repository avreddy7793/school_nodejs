const express = require('express');
const payments = require('./payments');

const router = express.Router();

router.get('/config', payments.getPublicConfig);
router.put('/config', payments.saveGatewayConfig);
router.post('/orders', payments.createOrder);
router.post('/verify', payments.verifyPayment);

module.exports = router;
