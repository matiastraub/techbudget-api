// routes/ultravoxWebhook.js
const express = require('express')
const router = express.Router()
const { protect, apiAuth } = require('../../middleware/auth')

const listsController = require('../../controllers/encuestas/listAttempts')

// Get all list attempts api
router.get('/n8n', apiAuth, listsController.getListAttempts)

//Get list attemps by Id
router.get('/n8n/:id', apiAuth, listsController.getListAtttempt)

//Get List Attempt by ultravox_call_id
router.get(
  '/n8n/ultravox/:ultravox',
  apiAuth,
  listsController.getListAtttemptByUltravox
)

router.post('/n8n/process-list', apiAuth, listsController.processList)

//Update status by Id
router.patch('/n8n/:id', apiAuth, listsController.updateListAttemptsStatusById)

router.patch(
  '/n8n/ultravox/:ultravoxCallId',
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
