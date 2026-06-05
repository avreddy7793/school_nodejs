const express = require('express');
const holidays = require('./holidays');

const router = express.Router();

router.get('/', holidays.listHolidays);
router.post('/', holidays.createHoliday);
router.put('/:holidayId', holidays.updateHoliday);
router.put('/:holidayId/publish', holidays.publishHoliday);
router.delete('/:holidayId', holidays.deleteHoliday);

module.exports = router;
