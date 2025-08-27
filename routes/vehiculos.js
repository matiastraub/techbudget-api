const express = require('express')
const router = express.Router()
const { protect, apiAuthChileAutos } = require('../middleware/auth')
const { webhook, test } = require('../controllers/vehiculos.js')

router.route('/chileautos/jmd').post(apiAuthChileAutos, test)

router.route('/chileautos/jmd').post(apiAuthChileAutos, webhook)

router.route('/chileautos/jmd/:sellerId').post(apiAuthChileAutos, webhook)

module.exports = router
