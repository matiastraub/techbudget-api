const express = require('express')
const router = express.Router()

const {
  connectMercadoLibre,
  mercadoLibreCallback,
  mercadoLibreWebhook,
} = require('../controllers/mercadolibre')

// 1. Inicia OAuth (redirige a ML)
router.get('/oauth/connect', connectMercadoLibre)

// 2. Callback OAuth (Redirect URI)
router.get('/oauth/callback', mercadoLibreCallback)

// 3. Webhooks (opcional)
router.post('/webhook', mercadoLibreWebhook)

module.exports = router
