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

// Update status
router.patch('/n8n', apiAuth, listsController.updateListAttemptStatus)

router.post('/ultravox-calls', async (req, res, next) => {
  try {
    const { event, call } = req.body

    if (!call?.callId) return res.status(400).json({ error: 'Missing callId' })

    let status = null

    switch (event) {
      case 'call.started':
        status = 'calling'
        break
      case 'call.joined':
        status = 'answered'
        break
      case 'call.ended':
        status = call.status || 'failed' // success, failed, no_answer, etc.
        break
      default:
        return res.status(200).json({ message: 'Event ignored' })
    }

    await listsController.updateListAttemptStatusByUltravox(call.callId, status)

    res.status(200).json({ success: true })
  } catch (err) {
    next(err)
  }
})

// Get all list attempts
router.get('/', protect, listsController.getListAttempts)

module.exports = router
