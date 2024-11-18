const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { getCrypto } = require('../controllers/external')

router.route('/').get(protect, getCrypto)

module.exports = router
