const express = require('express');
const transports = require('./transports');

const router = express.Router();

router.get('/', transports.getTransports);
router.get('/:transportId', transports.getTransportById);
router.post('/', transports.createTransport);
router.put('/:transportId', transports.updateTransport);
router.delete('/:transportId', transports.deleteTransport);

module.exports = router;
