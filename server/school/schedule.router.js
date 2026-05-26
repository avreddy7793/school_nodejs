const express = require('express');
const schedule = require('./schedule');

const router = express.Router();

router.get('/sessions', schedule.getSessions);
router.post('/sessions', schedule.createSession);
router.get('/periods', schedule.getPeriods);
router.post('/periods', schedule.createPeriod);
router.get('/', schedule.getSchedules);
router.get('/:scheduleId', schedule.getScheduleById);
router.post('/', schedule.createSchedule);
router.put('/:scheduleId', schedule.updateSchedule);
router.delete('/:scheduleId', schedule.deleteSchedule);
router.get('/:scheduleId/students', schedule.getStudentsForSchedule);
router.get('/teacher-attendance', schedule.getTeacherAttendance);
router.post('/teacher-attendance', schedule.saveTeacherAttendance);
router.get('/student-attendance', schedule.getStudentAttendance);
router.post('/student-attendance', schedule.saveStudentAttendance);

module.exports = router;
