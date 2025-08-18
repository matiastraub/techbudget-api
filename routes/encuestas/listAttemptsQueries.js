const express = require('express')
const router = express.Router()
const { apiAuth } = require('../../middleware/auth')
const listAttemptsQueries = require('../../controllers/encuestas/listAttemptsQueries')

router.get('/n8n/status', apiAuth, listAttemptsQueries.getListAttemptsStatus)

module.exports = router
