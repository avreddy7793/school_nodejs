const express = require('express');
const teachers = require('./teachers');

const router = express.Router();

router.get('/', teachers.getTeachers);
router.get('/by-subject', teachers.getTeachersBySubject);
router.get('/:teacherId', teachers.getTeacherById);
router.post('/', teachers.createTeacher);
router.put('/:teacherId', teachers.updateTeacher);
router.delete('/:teacherId', teachers.deleteTeacher);

module.exports = router;
