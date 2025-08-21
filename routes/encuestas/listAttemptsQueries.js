const express = require('express')
const router = express.Router()
const { protect, apiAuth } = require('../../middleware/auth')
const listAttemptsQueries = require('../../controllers/encuestas/listAttemptsQueries')
const listAttemptsController = require('../../controllers/encuestas/listAttempts')

router.get('/status', protect, listAttemptsQueries.getListAttemptsStatus)
router.get('/n8n/status', apiAuth, listAttemptsQueries.getListAttemptsStatus)
router.get(
  '/n8n/byStatus/:status',
  apiAuth,
  listAttemptsQueries.getListAttemptsByStatus
)

router.patch(
  '/n8n/update-lists',
  apiAuth,
  listAttemptsController.updateListAttemptsStatusBulk
)

module.exports = router
