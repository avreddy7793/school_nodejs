const express = require('express');
const onlineExams = require('./online-exams');

const router = express.Router();

router.get('/', onlineExams.listOnlineExams);
router.get('/available', onlineExams.getAvailableExams);
router.get('/:examId/questions', onlineExams.getQuestions);
router.post('/:examId/questions', onlineExams.saveQuestions);
router.post('/:examId/generate-questions', onlineExams.generateQuestions);
router.put('/:examId/settings', onlineExams.updateSettings);
router.get('/:examId/attempt', onlineExams.getAttempt);
router.post('/:examId/submit', onlineExams.submitAttempt);
router.get('/:examId/summary', onlineExams.getSummary);
router.get('/:examId/review', onlineExams.getStudentReview);

module.exports = router;
