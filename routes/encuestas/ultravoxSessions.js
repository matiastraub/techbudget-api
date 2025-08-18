const express = require('express')
const router = express.Router()
const { apiAuth, protect } = require('../../middleware/auth')

const ultravoxSessions = require('../../controllers/encuestas/ultravoxSessions')

router.get('/n8n', apiAuth, ultravoxSessions.getUltravoxSessions)
router.put('/n8n', apiAuth, ultravoxSessions.updateUltravoxSessions)

router.get('/', protect, ultravoxSessions.getUltravoxSessions)

module.exports = router
