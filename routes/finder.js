const express = require('express')

const router = express.Router()
const { apiAuthAloAutos } = require('../middleware/auth')

const { getPlateInfo } = require('../controllers/finder')

router.route('/plate/:plate').get(apiAuthAloAutos, getPlateInfo)

module.exports = router
