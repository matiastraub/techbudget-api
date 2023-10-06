const express = require('express');

const router = express.Router();
const { protect } = require('../middleware/auth');

const {
  register, login, getMe, logout, forgotPassword, resetPassword,
} = require('../controllers/auth');

router.route('/me').get(protect, getMe);

router.route('/register').post(register);

router.route('/login').post(login);

router.route('/logout').post(protect, logout);

router.route('/forgotPassword').post(forgotPassword);

router.route('/resetPassword/:resettoken').put(resetPassword);

module.exports = router;
