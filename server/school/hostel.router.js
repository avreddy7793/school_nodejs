const express = require('express');
const hostel = require('./hostel');

const router = express.Router();

router.get('/rooms', hostel.getRooms);
router.get('/rooms/:roomId', hostel.getRoomById);
router.post('/rooms', hostel.createRoom);
router.put('/rooms/:roomId', hostel.updateRoom);
router.delete('/rooms/:roomId', hostel.deleteRoom);
router.get('/assignments', hostel.getAssignments);
router.post('/assignments', hostel.createAssignment);
router.put('/assignments/:assignmentId', hostel.updateAssignment);
router.delete('/assignments/:assignmentId', hostel.deleteAssignment);
router.get('/payments', hostel.getPayments);
router.post('/payments', hostel.createPayment);

module.exports = router;
