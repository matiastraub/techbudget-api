const express = require('express')
const router = express.Router()

const {
  connectMercadoLibre,
  mercadoLibreCallback,
  mercadoLibreWebhook,
  getMercadoLibreWebhook,
  getConnectToN8N,
  postConnectToN8N,
} = require('../controllers/mercadolibre')

// 1. Inicia OAuth (redirige a ML)
router.get('/connect', connectMercadoLibre)

// 2. Callback OAuth (Redirect URI)
router.get('/oauth/callback', mercadoLibreCallback)

// 3. Webhooks
router.post('/webhook', mercadoLibreWebhook)

router.get('/webhook', getMercadoLibreWebhook)

router.get('/webhook/v2', getConnectToN8N)
router.post('/webhook/v2', postConnectToN8N)

module.exports = router
