const express = require('express');
const db = require('../api');
const subjects = require('./subjects');

const router = express.Router();

function normalizeRole(value) {
  return String(value || '').trim().toUpperCase().replace(/[_-]+/g, ' ');
}

function requireSubjectAdmin(req, res, next) {
  const decoded = req.decoded || {};
  const roles = [
    decoded.role,
    decoded.role_name,
    decoded.login_type,
    decoded.category,
    decoded.entity_type
  ].map(normalizeRole);

  const isAdmin = roles.some((role) => [
    'SUPER ADMIN',
    'SCHOOL ADMIN',
    'ADMIN',
    'ADMINISTRATOR',
    'MASTER',
    'OWNER',
    'PRINCIPAL',
    'MANAGER',
    'BRANCH MANAGER'
  ].includes(role)) || ['1', '2', '3', '4', '5'].includes(String(decoded.role || ''));

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only admin users can manage subjects.'
    });
  }

  return next();
}

const subjectAdminAccess = [db.checkToken, requireSubjectAdmin];

router.get('/', subjects.getSubjects);
router.get('/dropdown', subjects.getSubjectsDropdown);
router.get('/:subjectId', subjects.getSubjectById);
router.post('/', subjectAdminAccess, subjects.createSubject);
router.put('/:subjectId', subjectAdminAccess, subjects.updateSubject);
router.delete('/:subjectId', subjectAdminAccess, subjects.deleteSubject);

module.exports = router;
