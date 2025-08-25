const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { forwardCall } = require('../controllers/twilio')

//router.route('/').get(protect, getCall)

router.route('/forward').post(forwardCall)

module.exports = router
