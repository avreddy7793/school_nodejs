const express = require('express');
const students = require('./students');

const router = express.Router();

router.get('/next-admission-number', students.getNextAdmissionNumber);
router.get('/', students.getStudents);
router.get('/:studentId', students.getStudentById);
router.post('/', students.createStudent);
router.put('/:studentId/deactivate', students.deactivateStudent);
router.put('/:studentId', students.updateStudent);
router.delete('/:studentId', students.deleteStudent);

module.exports = router;
