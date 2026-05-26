const express = require('express');
const exams = require('./exams');
const subjects = require('./subjects');

const router = express.Router();

router.get('/subjects', subjects.getSubjects);
router.get('/results', exams.getExamResults);
router.post('/results', exams.createExamResult);
router.delete('/results/:resultId', exams.deleteExamResult);
router.get('/', exams.getExams);
router.get('/:examId', exams.getExamById);
router.get('/:examId/results', exams.getExamResults);
router.post('/', exams.createExam);
router.put('/:examId', exams.updateExam);
router.delete('/:examId', exams.deleteExam);

module.exports = router;
