const express = require('express');
const classroomSessions = require('./classroom-sessions');

const router = express.Router();

router.get('/', classroomSessions.getClassroomSessions);
router.get('/:sessionId', classroomSessions.getClassroomSessionById);
router.post('/', classroomSessions.createClassroomSession);
router.put('/:sessionId', classroomSessions.updateClassroomSession);
router.delete('/:sessionId', classroomSessions.deleteClassroomSession);

module.exports = router;
