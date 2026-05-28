const express = require('express');
const schedule = require('./schedule');
const db = require('../api');

const router = express.Router();

const ADMIN_ASSIGNMENT_ROLE_IDS = new Set(['1', '2', '3', '4', '5']);
const ADMIN_ASSIGNMENT_ROLE_NAMES = new Set([
  'ADMIN',
  'ADMINISTRATOR',
  'BRANCH MANAGER',
  'MANAGER',
  'MASTER',
  'OWNER',
  'SCHOOL ADMIN',
  'SUPER',
  'SUPER ADMIN'
]);

function normalizeRole(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim().toUpperCase().replace(/[-_]+/g, ' ');
}

function requireTeacherAssignmentAccess(req, res, next) {
  const decoded = req.decoded || {};
  const roleId = normalizeRole(decoded.role);
  const candidates = [
    decoded.role_name,
    decoded.login_type,
    decoded.category,
    decoded.entity_type
  ].map(normalizeRole);
  const hasAdminRoleName = candidates.some((role) => ADMIN_ASSIGNMENT_ROLE_NAMES.has(role));
  const hasExplicitNonAdminRole = candidates.some((role) => role && !ADMIN_ASSIGNMENT_ROLE_NAMES.has(role));

  if (hasAdminRoleName || (ADMIN_ASSIGNMENT_ROLE_IDS.has(roleId) && !hasExplicitNonAdminRole)) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Only admin, manager, or administrator users can assign teachers to classes.'
  });
}

const assignmentAccess = [db.checkToken, requireTeacherAssignmentAccess];

router.get('/sessions', schedule.getSessions);
router.post('/sessions', assignmentAccess, schedule.createSession);
router.get('/periods', schedule.getPeriods);
router.post('/periods', assignmentAccess, schedule.createPeriod);
router.get('/teacher-attendance', schedule.getTeacherAttendance);
router.post('/teacher-attendance', schedule.saveTeacherAttendance);
router.get('/student-attendance', schedule.getStudentAttendance);
router.post('/student-attendance', schedule.saveStudentAttendance);
router.get('/', schedule.getSchedules);
router.post('/', assignmentAccess, schedule.createSchedule);
router.put('/:scheduleId/teacher', assignmentAccess, schedule.assignTeacherToSchedule);
router.get('/:scheduleId/students', schedule.getStudentsForSchedule);
router.get('/:scheduleId', schedule.getScheduleById);
router.put('/:scheduleId', assignmentAccess, schedule.updateSchedule);
router.delete('/:scheduleId', assignmentAccess, schedule.deleteSchedule);

module.exports = router;
