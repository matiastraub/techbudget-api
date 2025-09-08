const express = require('express')
const router = express.Router()
const { protect, apiAuth } = require('../middleware/auth')
const { getCallUltravox, createCall } = require('../controllers/agents')

router.route('/').get(protect, getCallUltravox)

router.route('/:promptName').post(createCall)

module.exports = router
