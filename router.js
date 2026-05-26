const express = require('express');
const userController = require('./server/user');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'School API is ready'
  });
});

router.post('/login', userController.login);
router.post('/auth/login', userController.login);

module.exports = router;
