const express = require('express');
const timetable = require('./timetable');

const router = express.Router();

router.get('/sections', timetable.getSections);
router.post('/sections', timetable.createSection);
router.put('/sections/:id', timetable.updateSection);
router.delete('/sections/:id', timetable.deleteSection);
router.get('/session-periods', timetable.getSessionPeriods);

router.get('/teacher-subject-assignments', timetable.getTeacherSubjectAssignments);
router.post('/teacher-subject-assignments', timetable.createTeacherSubjectAssignment);
router.put('/teacher-subject-assignments/:id', timetable.updateTeacherSubjectAssignment);
router.delete('/teacher-subject-assignments/:id', timetable.deleteTeacherSubjectAssignment);

router.get('/class-schedule/classroom', timetable.getClassroomSchedule);
router.get('/class-schedule/teacher', timetable.getTeacherSchedule);
router.get('/class-schedule/day', timetable.getDaySchedule);
router.get('/class-schedule', timetable.getClassSchedule);
router.post('/class-schedule', timetable.createClassSchedule);
router.put('/class-schedule/:id', timetable.updateClassSchedule);
router.delete('/class-schedule/:id', timetable.deleteClassSchedule);

module.exports = router;
