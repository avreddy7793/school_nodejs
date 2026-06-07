const express = require('express');
const fees = require('./fees');

const router = express.Router();

router.get('/', fees.getFeeRecords);
router.get('/payments', fees.getAllFeePayments);
router.get('/:feeId/payments', fees.getFeePayments);
router.get('/:feeId', fees.getFeeRecordById);
router.post('/', fees.createFeeRecord);
router.put('/:feeId', fees.updateFeeRecord);
router.delete('/:feeId', fees.deleteFeeRecord);

module.exports = router;
