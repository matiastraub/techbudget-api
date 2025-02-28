const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { getCrypto, getCryptoHistory } = require('../controllers/external')

router.route('/').get(protect, getCrypto)
router.route('/history/:time').get(protect, getCryptoHistory)

module.exports = router
