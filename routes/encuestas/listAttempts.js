// routes/ultravoxWebhook.js
const express = require('express')
const router = express.Router()
const { protect, apiAuth } = require('../../middleware/auth')

const listsController = require('../../controllers/encuestas/listAttempts')
// Get all list attempts
router.get('/', protect, listsController.getListAttempts)

// Get all list attempts api
router.get('/api', apiAuth, listsController.getListAttempts)

// Update status
router.patch('/api', apiAuth, listsController.updateListAttemptStatus)

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

module.exports = router
