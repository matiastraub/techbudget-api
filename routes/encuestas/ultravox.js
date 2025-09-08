const { apiAuth } = require('../../middleware/auth')
const { getCallUltravox, createCall } = require('../../controllers/agents')
const express = require('express')
const router = express.Router()
const rateLimit = require('express-rate-limit')

// Special limiter for Ultravox webhooks
const ultravoxLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // allow 1000 requests per minute (very high tolerance)
  message: 'Too many requests to Ultravox webhook',
})

router.route('/n8n').get(ultravoxLimiter, apiAuth, getCallUltravox)

router.route('/n8n/:promptName').post(ultravoxLimiter, apiAuth, createCall)

module.exports = router
