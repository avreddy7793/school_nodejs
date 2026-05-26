const express = require('express');
const staff = require('./staff');

const router = express.Router();

router.get('/', staff.getStaff);
router.get('/:staffId', staff.getStaffById);
router.post('/', staff.createStaff);
router.put('/:staffId', staff.updateStaff);
router.delete('/:staffId', staff.deleteStaff);

module.exports = router;
