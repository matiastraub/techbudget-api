const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { getCountries } = require('../controllers/mysql/countries')

router.route('/').get(protect, getCountries)

module.exports = router
