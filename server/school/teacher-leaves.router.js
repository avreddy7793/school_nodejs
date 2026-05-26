const express = require('express');
const teacherLeaves = require('./teacher-leaves');

const router = express.Router();

router.get('/', teacherLeaves.getTeacherLeaves);
router.get('/:leaveId', teacherLeaves.getTeacherLeaveById);
router.post('/', teacherLeaves.createTeacherLeave);
router.put('/:leaveId', teacherLeaves.updateTeacherLeave);
router.delete('/:leaveId', teacherLeaves.deleteTeacherLeave);

module.exports = router;
