const express = require('express');
const multer = require('multer');
const students = require('./students');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

router.get('/next-admission-number', students.getNextAdmissionNumber);
router.post('/import', upload.single('file'), students.importStudents);
router.get('/', students.getStudents);
router.get('/:studentId', students.getStudentById);
router.post('/', students.createStudent);
router.put('/:studentId/deactivate', students.deactivateStudent);
router.put('/:studentId', students.updateStudent);
router.delete('/:studentId', students.deleteStudent);

module.exports = router;
