const express = require('express');
const db = require('../api');
const exams = require('./exams');
const examWizard = require('./exam-wizard');
const subjects = require('./subjects');

const router = express.Router();

function normalizeRole(value) {
  return String(value || '').trim().toUpperCase().replace(/[_-]+/g, ' ');
}

function isTeacher(decoded = {}) {
  return [decoded.role, decoded.role_name, decoded.login_type, decoded.category, decoded.entity_type]
    .map(normalizeRole)
    .includes('TEACHER');
}

function scopeTeacher(req, res, next) {
  const decoded = req.decoded || {};
  if (isTeacher(decoded)) {
    const teacherId = decoded.teacher_id || (normalizeRole(decoded.entity_type) === 'TEACHER' ? decoded.entity_id : null);
    if (!teacherId) {
      return res.status(403).json({ success: false, message: 'Teacher login is not linked to a teacher profile.' });
    }

    req.query.teacher_id = String(teacherId);
    req.body.teacherId = teacherId;
    req.body.teacher_id = teacherId;
  }

  return next();
}

const examAccess = [db.checkToken, scopeTeacher];
const examAdminAccess = [db.checkToken, examWizard.requireExamAdmin];

router.get('/subjects', subjects.getSubjects);
router.get('/wizard/dashboard', examAccess, examWizard.getDashboard);
router.get('/groups', examAccess, examWizard.getExamGroups);
router.post('/groups', examAdminAccess, examWizard.createExamGroup);
router.get('/groups/:examGroupId/timetable/preview', examAccess, examWizard.previewTimetable);
router.get('/groups/:examGroupId/timetable', examAccess, examWizard.getTimetable);
router.post('/groups/:examGroupId/timetable', examAdminAccess, examWizard.saveTimetable);
router.get('/groups/:examGroupId/hall-tickets/preview', examAccess, examWizard.previewHallTickets);
router.get('/groups/:examGroupId/hall-tickets', examAccess, examWizard.getHallTickets);
router.post('/groups/:examGroupId/hall-tickets/generate', examAdminAccess, examWizard.generateHallTickets);
router.get('/groups/:examGroupId/marks-entry', examAccess, examWizard.getMarksEntry);
router.post('/groups/:examGroupId/marks-entry', examAccess, examWizard.saveMarksEntry);
router.post('/groups/:examGroupId/process-results', examAdminAccess, examWizard.processResults);
router.post('/groups/:examGroupId/publish-results', examAdminAccess, examWizard.publishResults);
router.get('/groups/:examGroupId/reports', examAccess, examWizard.getReports);
router.put('/groups/:examGroupId/classes', examAdminAccess, examWizard.saveExamGroupClasses);
router.put('/groups/:examGroupId/settings', examAdminAccess, examWizard.saveExamGroupSettings);
router.get('/groups/:examGroupId', examAccess, examWizard.getExamGroupById);
router.put('/groups/:examGroupId', examAdminAccess, examWizard.updateExamGroup);
router.delete('/groups/:examGroupId', examAdminAccess, examWizard.deleteExamGroup);
router.get('/results', examAccess, exams.getExamResults);
router.post('/results', examAccess, exams.createExamResult);
router.put('/results/:resultId', examAccess, exams.updateExamResult);
router.delete('/results/:resultId', examAccess, exams.deleteExamResult);
router.get('/', examAccess, exams.getExams);
router.get('/:examId', examAccess, exams.getExamById);
router.get('/:examId/results', examAccess, exams.getExamResults);
router.post('/', examAccess, exams.createExam);
router.put('/:examId/close', examAccess, exams.closeExam);
router.put('/:examId', examAccess, exams.updateExam);
router.delete('/:examId', examAccess, exams.deleteExam);

module.exports = router;
