const express = require('express');
const syllabus = require('./syllabus');

const router = express.Router();

router.get('/', syllabus.getSyllabus);
router.post('/', syllabus.createSyllabusUnit);
router.put('/units/:unitId', syllabus.updateSyllabusUnit);
router.delete('/units/:unitId', syllabus.deleteSyllabusUnit);

module.exports = router;
