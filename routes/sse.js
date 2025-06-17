const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { getCryptoPrices, sseHandler } = require('../controllers/sse')

router.route('/crypto').get(protect, getCryptoPrices)
router.route('/').get(protect, sseHandler)

module.exports = router
