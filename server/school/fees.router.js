const express = require('express');
const db = require('../api');
const fees = require('./fees');

const router = express.Router();

function normalizeRole(value) {
  return String(value || '').trim().toUpperCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function requireSuperAdmin(req, res, next) {
  const decoded = req.decoded || {};
  const roles = [
    decoded.role,
    decoded.roleName,
    decoded.role_name,
    decoded.login_type,
    decoded.loginType,
    decoded.category
  ].map(normalizeRole);

  if (!roles.some((role) => ['SUPER ADMIN', 'SUPER'].includes(role))) {
    return res.status(403).json({
      success: false,
      message: 'Only Super Admin can edit fee records'
    });
  }

  return next();
}

router.get('/', fees.getFeeRecords);
router.get('/payments', fees.getAllFeePayments);
router.get('/:feeId/payments', fees.getFeePayments);
router.get('/:feeId', fees.getFeeRecordById);
router.post('/', fees.createFeeRecord);
router.put('/:feeId/edit', db.checkToken, requireSuperAdmin, fees.updateFeeRecord);
router.put('/:feeId', fees.updateFeeRecord);
router.delete('/:feeId', fees.deleteFeeRecord);

module.exports = router;
