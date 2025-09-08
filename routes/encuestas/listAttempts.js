// routes/ultravoxWebhook.js
const express = require('express')
const router = express.Router()
const { protect, apiAuth } = require('../../middleware/auth')
const rateLimit = require('express-rate-limit')

const listsController = require('../../controllers/encuestas/listAttempts')
// Special limiter for Ultravox webhooks
const ultravoxLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // allow 1000 requests per minute (very high tolerance)
  message: 'Too many requests to Ultravox webhook',
})

// Get all list attempts api
router.get('/n8n', ultravoxLimiter, apiAuth, listsController.getListAttempts)

//Get list attemps by Id
router.get(
  '/n8n/:id',
  ultravoxLimiter,
  apiAuth,
  listsController.getListAtttempt
)

//Get List Attempt by ultravox_call_id
router.get(
  '/n8n/ultravox/:ultravox',
  ultravoxLimiter,
  apiAuth,
  listsController.getListAtttemptByUltravox
)

router.post(
  '/n8n/process-list',
  ultravoxLimiter,
  apiAuth,
  listsController.processList
)

//Update status by Id
router.patch(
  '/n8n/:id',
  ultravoxLimiter,
  apiAuth,
  listsController.updateListAttemptsStatusById
)

router.patch(
  '/n8n/ultravox/:ultravoxCallId',
  ultravoxLimiter,
  apiAuth,
  listsController.updateListAttemptsStatusByUltravoxCallId
)

router.post(
  '/n8n/ultravox-events',
  listsController.callStatusByUltravoxWebhookEvents
)

// Get all list attempts
router.get('/', protect, listsController.getListAttempts)

module.exports = router
