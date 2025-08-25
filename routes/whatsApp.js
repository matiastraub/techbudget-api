const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const {
  sendVerification,
  sendVerificationPost,
} = require('../controllers/whatsApp')

//router.route('/').get(protect, getCall)

router.route('/verify').get(sendVerification)

router.route('/verify').post(sendVerificationPost)

module.exports = router
