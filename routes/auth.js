const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')

const {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendToken,
} = require('../controllers/auth')

router.route('/me').get(protect, getMe)

router.route('/register').post(register)

router.route('/verifyEmail').post(verifyEmail)

router.route('/resendToken').put(protect, resendToken)

router.route('/login').post(login)

//router.route('/logout').post(protect, logout)
router.route('/logout').post(logout)

router.route('/forgotPassword').post(forgotPassword)

router.route('/resetPassword').post(resetPassword)

module.exports = router
