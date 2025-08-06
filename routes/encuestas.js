const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')

const { getEncuestas, uploadEncuestaFile } = require('../controllers/encuestas')

const Lista = require('../models/Lista')
const advancedQueries = require('../middleware/advancedQueries')

router
  .route('/')
  .get(protect, advancedQueries(Lista, ['telefono', 'comuna']), getEncuestas)

router.route('/upload').post(protect, uploadEncuestaFile)

module.exports = router
