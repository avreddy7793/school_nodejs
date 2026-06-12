const express = require('express');
const db = require('../api');
const fees = require('./fees');

const router = express.Router();

function normalizeRole(value) {
  return String(value || '').trim().toUpperCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function requireFeeManager(req, res, next) {
  const decoded = req.decoded || {};
  const roles = [
    decoded.role,
    decoded.roleName,
    decoded.role_name,
    decoded.login_type,
    decoded.loginType,
    decoded.category
  ].map(normalizeRole);
  const allowedRoleNames = new Set([
    'SUPER ADMIN',
    'SUPER',
    'SCHOOL ADMIN',
    'ADMIN',
    'ADMINISTRATOR',
    'MASTER',
    'PRINCIPAL',
    'ACCOUNTANT',
    'ACCOUNTENT',
    'ACCOUNT MANAGER'
  ]);
  const allowedRoleIds = new Set(['1', '2', '3', '4', '5', '8', '9']);

  if (!roles.some((role) => allowedRoleNames.has(role) || allowedRoleIds.has(role))) {
    return res.status(403).json({
      success: false,
      message: 'Admin access is required to manage fee records'
    });
  }

  return next();
}

router.get('/', fees.getFeeRecords);
router.get('/payments', fees.getAllFeePayments);
router.get('/:feeId/payments', fees.getFeePayments);
router.get('/:feeId', fees.getFeeRecordById);
router.post('/', fees.createFeeRecord);
router.put('/:feeId/edit', db.checkToken, requireFeeManager, fees.updateFeeRecord);
router.put('/:feeId', fees.updateFeeRecord);
router.delete('/:feeId', db.checkToken, requireFeeManager, fees.deleteFeeRecord);

module.exports = router;
