const express = require('express');
const db = require('../api');
const onlineExams = require('./online-exams');

const router = express.Router();

router.get('/', db.checkToken, onlineExams.listOnlineExams);
router.get('/available', onlineExams.getAvailableExams);
router.get('/:examId/questions', db.checkToken, onlineExams.getQuestions);
router.post('/:examId/questions', db.checkToken, onlineExams.saveQuestions);
router.post('/:examId/generate-questions', db.checkToken, onlineExams.generateQuestions);
router.put('/:examId/settings', db.checkToken, onlineExams.updateSettings);
router.get('/:examId/question-paper', db.checkToken, onlineExams.getQuestionPaper);
router.put('/:examId/question-paper', db.checkToken, onlineExams.uploadQuestionPaper);
router.get('/:examId/attempt', onlineExams.getAttempt);
router.post('/:examId/submit', onlineExams.submitAttempt);
router.get('/:examId/summary', db.checkToken, onlineExams.getSummary);
router.get('/:examId/review', onlineExams.getStudentReview);

module.exports = router;
