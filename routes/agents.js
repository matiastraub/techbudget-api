const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { getCall, createCall } = require('../controllers/agents')

router.route('/').get(protect, getCall)

router.route('/:promptName').post(createCall)

module.exports = router
