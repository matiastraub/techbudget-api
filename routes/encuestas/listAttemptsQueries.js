const express = require('express')
const router = express.Router()
const { protect, apiAuth } = require('../../middleware/auth')
const listAttemptsQueries = require('../../controllers/encuestas/listAttemptsQueries')
const listAttemptsController = require('../../controllers/encuestas/listAttempts')

router.get(
  '/channel/phone/campaign/:id',
  protect,
  listAttemptsQueries.getListsChannelPhoneByCampaign
)

router.get('/channel/phone', protect, listAttemptsQueries.getListsChannelPhone)

router.get(
  '/n8n/channel/phone',
  apiAuth,
  listAttemptsQueries.getListsChannelPhone
)

router.get(
  '/n8n/channel/phone/campaign/:id',
  apiAuth,
  listAttemptsQueries.getListsChannelPhoneByCampaign
)

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
