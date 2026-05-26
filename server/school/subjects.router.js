const express = require('express');
const subjects = require('./subjects');

const router = express.Router();

router.get('/', subjects.getSubjects);
router.get('/:subjectId', subjects.getSubjectById);
router.post('/', subjects.createSubject);
router.put('/:subjectId', subjects.updateSubject);
router.delete('/:subjectId', subjects.deleteSubject);

module.exports = router;
