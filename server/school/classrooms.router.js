const express = require('express');
const classrooms = require('./classrooms');

const router = express.Router();

router.get('/', classrooms.getClassrooms);
router.get('/:classroomId', classrooms.getClassroomById);
router.post('/', classrooms.createClassroom);
router.put('/:classroomId', classrooms.updateClassroom);
router.delete('/:classroomId', classrooms.deleteClassroom);

module.exports = router;
