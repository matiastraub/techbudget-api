/**
 *
 * Connection management: Tracks active SSE connections per campaign
 * Heartbeat: Keeps connections alive with periodic pings
 * Event types:
 *   initial-load - Send data when client first connects
 *   new-call - When a new call is created
 *   status-change - When call status changes (pending → answered → failed)
 *   call-updated - When any call data is updated
 *   heartbeat - Connection keep-alive
 *
 */
const pool = require('../../config/mysql')
const {
  getListsChannelPhoneByCampaignRequest,
} = require('./listAttemptsQueries')
const asyncHandler = require('../../middleware/async')
const EventEmitter = require('events')

// Create a global event emitter for call updates
const callEventEmitter = new EventEmitter()

// Store active SSE connections
const activeConnections = new Map()

// Your existing query function (keep this as is for initial data load)
exports.getListsChannelPhoneByCampaign = asyncHandler(
  async (req, res, next) => {
    const { id } = req.params
    const query = `SELECT l.phone, la.id, la.list_id, la.status,la.ultravox_call_id,us.candidate_id,
                CONCAT(ca.name," ",ca.lastname) AS candidate,ca.name AS candidate_name,
                ca.lastname AS candidate_lastname,
                m.name AS municipality,r.name AS region,r.code AS \`region_code\`, d.id AS \`district\`,
                us.created,us.joined, us.ended
                FROM list_attempts la
                INNER JOIN lists l ON l.id = la.list_id
                INNER JOIN municipalities m ON m.id = l.municipality_id
                INNER JOIN districts d ON d.id = m.district_id
                INNER JOIN regions r ON r.id = m.region_id
                LEFT JOIN ultravox_sessions us ON us.ultravox_call_id = la.ultravox_call_id
                LEFT JOIN candidates ca ON ca.id = us.candidate_id
                WHERE l.campaign_id = ?`
    const [rows] = await pool.query(query, [id])

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    })
  }
)

// NEW: SSE endpoint for real-time call updates
exports.getCallUpdatesStream = asyncHandler(async (req, res, next) => {
  const { campaignId } = req.params
  const connectionId = `${campaignId}-${Date.now()}-${Math.random()}`

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  })

  // Send initial connection confirmation
  res.write(
    `data: ${JSON.stringify({
      data: [],
      type: 'connection',
      message: 'Connected to call updates stream',
      timestamp: new Date().toISOString(),
    })}\n\n`
  )

  // Send initial data load
  try {
    const initialData = await getListsChannelPhoneByCampaignRequest(campaignId)

    res.write(
      `data: ${JSON.stringify({
        type: 'initial-load',
        data: JSON.stringify(initialData),
        count: initialData?.count,
        //   message: 'hola',
        timestamp: new Date().toISOString(),
      })}\n\n`
    )
  } catch (error) {
    console.error('Error sending initial data:', error)
    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        message: 'Failed to load initial data',
      })}\n\n`
    )
  }

  // Store this connection
  activeConnections.set(connectionId, {
    res,
    campaignId,
    timestamp: new Date(),
  })

  // Listen for call updates specific to this campaign
  const handleCallUpdate = (data) => {
    if (parseInt(data.campaignId) === parseInt(campaignId)) {
      try {
        res.write(
          `data: ${JSON.stringify({
            type: 'call-updated',
            ...data,
          })}\n\n`
        )
      } catch (error) {
        console.error('Error sending update:', error)
        cleanup()
      }
    }
  }

  const handleStatusChange = (data) => {
    if (data.campaignId === campaignId) {
      try {
        res.write(
          `data: ${JSON.stringify({
            type: 'status-change',
            ...data,
          })}\n\n`
        )
      } catch (error) {
        console.error('Error sending status change:', error)
        cleanup()
      }
    }
  }

  const handleNewCall = (data) => {
    if (data.data.campaignId === parseInt(campaignId)) {
      try {
        res.write(
          `data: ${JSON.stringify({
            type: 'new-call',
            ...data,
          })}\n\n`
        )
      } catch (error) {
        console.error('Error sending new call:', error)
        cleanup()
      }
    }
  }

  // Register event listeners
  callEventEmitter.on('call-updated', handleCallUpdate)
  callEventEmitter.on('status-changed', handleStatusChange)
  callEventEmitter.on('new-call', handleNewCall)

  // Send periodic heartbeat to keep connection alive
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(
        `data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
        })}\n\n`
      )
    } catch (error) {
      console.error('Heartbeat failed:', error)
      cleanup()
    }
  }, 30000) // Every 30 seconds

  // Cleanup function
  const cleanup = () => {
    console.log(`SSE connection closed for campaign ${campaignId}`)
    clearInterval(heartbeatInterval)
    activeConnections.delete(connectionId)
    callEventEmitter.off('call-updated', handleCallUpdate)
    callEventEmitter.off('status-changed', handleStatusChange)
    callEventEmitter.off('new-call', handleNewCall)
  }

  // Handle client disconnect
  req.on('close', cleanup)
  req.on('end', cleanup)
  res.on('close', cleanup)
})

// Helper function to get calls data (extracted from your existing function)
async function getCallsData(campaignId) {
  const query = `SELECT l.phone, la.id, la.list_id, la.status,la.ultravox_call_id,us.candidate_id,
              CONCAT(ca.name," ",ca.lastname) AS candidate,ca.name AS candidate_name,
              ca.lastname AS candidate_lastname,
              m.name AS municipality,r.name AS region,r.code AS \`region_code\`, d.id AS \`district\`,
              us.created,us.joined, us.ended
              FROM list_attempts la
              INNER JOIN lists l ON l.id = la.list_id
              INNER JOIN municipalities m ON m.id = l.municipality_id
              INNER JOIN districts d ON d.id = m.district_id
              INNER JOIN regions r ON r.id = m.region_id
              LEFT JOIN ultravox_sessions us ON us.ultravox_call_id = la.ultravox_call_id
              LEFT JOIN candidates ca ON ca.id = us.candidate_id
              WHERE l.campaign_id = ?`

  const [rows] = await pool.query(query, [campaignId])

  return {
    success: true,
    count: rows.length,
    data: rows,
  }
}

// Functions to emit events when data changes (call these from other parts of your app)

// Call this when a new call is created
exports.emitNewCall = (callData, campaignId) => {
  try {
    callEventEmitter.emit('new-call', {
      campaignId,
      data: callData,
    })
  } catch (error) {
    console.error('Error in emitNewCall:', error.message)
  }
}

// Call this when a call status changes
exports.emitStatusChange = (
  callId,
  newStatus,
  campaignId,
  additionalData = {}
) => {
  callEventEmitter.emit('status-changed', {
    campaignId,
    callId,
    newStatus,
    ...additionalData,
    timestamp: new Date().toISOString(),
  })
}

// Call this when a call is updated
exports.emitCallUpdate = (callData, campaignId) => {
  setImmediate(() => {
    console.log('setImmediate: ', callData)
    callEventEmitter.emit('call-updated', {
      campaignId,
      data: callData,
      timestamp: new Date().toISOString(),
    })
  })
}

// Test function to broadcast to all connections for a campaign
exports.broadcastToCampaignTest = async (req, res, next) => {
  //campaignId, eventType, data

  const { campaignId, eventType } = req.params

  const data = {}

  const donalsito = {
    phone: '942737696',
    id: 32,
    list_id: 21,
    status: 'pending',
    ultravox_call_id: '417e46a6-1615-466b-806d-08bf206baeff',
    candidate_id: '5',
    candidate: 'Donald Trump',
    candidate_name: 'Donald',
    candidate_lastname: 'Trump',
    municipality: 'Las Condes',
    region: 'Región Metropolitana',
    region_code: 'RM',
    district: 11,
    created: '2025-08-13T00:55:48.008141Z',
    joined: '2025-08-13T00:55:53.962160Z',
    ended: '2025-08-13T00:57:19.150680Z',
  }

  callEventEmitter.emit(eventType, {
    campaignId,
    type: eventType,
    data: donalsito,
    count: 0,
    timestamp: new Date().toISOString(),
    ...data,
  })
  res.status(200).json({ success: true, msg: 'Broadcast initiated' })
}

// Utility function to broadcast to all connections for a campaign
exports.broadcastToCampaign = async (req, res, next) => {
  //campaignId, eventType, data
  const { campaignId, eventType } = req.params
  //eventType = 'call-updated' || 'new-call' || 'status-changed'
  //const eventTypes = 'call-updated'
  // Find all connections for this campaign
  // Get fresh data from database
  const freshData = await getCallsData(campaignId)

  callEventEmitter.emit(eventType, {
    campaignId,
    type: eventType,
    data: freshData.data,
    count: 0, // freshData.count,
    timestamp: new Date().toISOString(),
    ...data,
  })
  res.status(200).json({ success: true, msg: 'Broadcast initiated' })
}

// Get active connections count (for debugging/monitoring)
exports.getActiveConnections = () => {
  return {
    total: activeConnections.size,
    connections: Array.from(activeConnections.entries()).map(([id, conn]) => ({
      id,
      campaignId: conn.campaignId,
      connectedAt: conn.timestamp,
    })),
  }
}
