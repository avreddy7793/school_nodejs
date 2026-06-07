const express = require('express');
const db = require('../api');
const salary = require('./salary');

const router = express.Router();

router.get('/profiles', salary.getSalaryProfiles);
router.post('/profiles/sync', salary.syncSalaryProfiles);
router.put('/profiles/:profileId', salary.updateSalaryProfile);
router.get('/payroll-runs', salary.getPayrollRuns);
router.post('/payroll-runs/generate', db.checkToken, salary.generatePayrollRun);
router.get('/payroll-runs/:payrollRunId', salary.getPayrollRunById);
router.get('/payroll-items/:payrollItemId/payments', salary.getSalaryPayments);
router.post('/payroll-items/:payrollItemId/payments', salary.recordSalaryPayment);

module.exports = router;
