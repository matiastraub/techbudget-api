// In your routes file (e.g., routes/calls.js or routes/campaigns.js)
const express = require('express')
const router = express.Router()
const {
  getListsChannelPhoneByCampaign,
  getCallUpdatesStream,
  postTestSSE,
  broadcastToCampaignTest,
} = require('../../controllers/encuestas/sse') // Adjust path as needed

// Existing route for initial data load
router.get('/campaigns/:id/calls', getListsChannelPhoneByCampaign)

// NEW: SSE route for real-time updates
router.get('/campaigns/:campaignId/calls/stream', getCallUpdatesStream)

router.post(
  '/campaigns/:campaignId/calls/broadcast/:eventType',
  broadcastToCampaignTest
) // Allow POST for SSE

module.exports = router
