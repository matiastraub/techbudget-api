const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const {
  getGeolocation,
  getGeolocationWithKey,
} = require('../controllers/external')
const geocoder = require('../utils/geocoder')

router.route('/:address').get(protect, getGeolocation)

router.route(':key/:address').get(getGeolocationWithKey)

module.exports = router
