const express = require('express')
const router = express.Router()

const {
  connectMercadoLibre,
  mercadoLibreCallback,
  mercadoLibreWebhook,
  getMercadoLibreWebhook,
} = require('../controllers/mercadolibre')

// 1. Inicia OAuth (redirige a ML)
router.get('/connect', connectMercadoLibre)

// 2. Callback OAuth (Redirect URI)
router.get('/oauth/callback', mercadoLibreCallback)

// 3. Webhooks
router.post('/webhook', mercadoLibreWebhook)

router.get('/webhook', getMercadoLibreWebhook)

module.exports = router
