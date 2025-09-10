const express = require('express')
const router = express.Router()
const { apiAuth, protect } = require('../../middleware/auth')
const rateLimit = require('express-rate-limit')

// Special limiter for Ultravox webhooks
const ultravoxLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // allow 1000 requests per minute (very high tolerance)
  message: 'Too many requests to Ultravox webhook',
})

const ultravoxSessions = require('../../controllers/encuestas/ultravoxSessions')

router.get(
  '/n8n',
  ultravoxLimiter,
  apiAuth,
  ultravoxSessions.getUltravoxSessions
)
router.post(
  '/n8n/:campaignId',
  ultravoxLimiter,
  apiAuth,
  ultravoxSessions.createUltravoxSessions
)

router.get('/', protect, ultravoxSessions.getUltravoxSessions)

router.patch(
  '/n8n/update-candidates',
  ultravoxLimiter,
  apiAuth,
  ultravoxSessions.updateUltravoxSessionsWithCandidates
)

module.exports = router
