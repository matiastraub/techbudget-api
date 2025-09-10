// controllers/listAttempts.js
const ErrorResponse = require('../../utils/ErrorResponse')
const asyncHandler = require('../../middleware/async')
const pool = require('../../config/mysql')
const { getUltravoxSessionsRequest } = require('./ultravoxSessions')
//const { emitStatusChange } = require('../../controllers/encuestas/sse')
const { emitCallUpdate } = require('../../controllers/encuestas/sse')
const {
  getListsChannelPhoneByCampaignAndIdRequest,
} = require('./listAttemptsQueries')

// @desc    Get list attempt by Id
// @route   GET /api/encuestas/list-attempts/:id
// @access  Private
exports.getListAtttempt = asyncHandler(async (req, res, next) => {
  let query, params
  query = `SELECT * FROM list_attempts WHERE id = ?`
  params = [req.params.id]

  const [rows] = await pool.query(query, params)

  if (rows.length === 0) {
    return next(new ErrorResponse('List attempt not found', 404))
  }

  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows[0],
  })
})

// @desc    Get list attempt by Id or ultravox_call_id
// @route   GET /api/encuestas/list-attempts/n8n/ultravox/:ultravox
// @access  Private
exports.getListAtttemptByUltravox = asyncHandler(async (req, res, next) => {
  let query, params

  query = `SELECT * FROM list_attempts WHERE ultravox_call_id = ?`
  params = [req.params.ultravox]

  const [rows] = await pool.query(query, params)

  if (rows.length === 0) {
    return next(new ErrorResponse('List attempt not found', 404))
  }

  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows[0],
  })
})

const getAllListAttemptsRequest = async (campaignId) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT c.campaign_id, ca.id, c.phone,  m.name AS municipality,ch.name AS channel,
      ca.status, ca.attempt_time AS created,ca.ultravox_call_id AS ultravoxCallId
      FROM list_attempts ca
      INNER JOIN lists c ON ca.list_id = c.id
      INNER JOIN municipalities m ON c.municipality_id = m.id
      INNER JOIN channels ch ON ca.channel_id = ch.id
      WHERE c.campaign_id = ?
    `,
      [campaignId]
    )

    return rows
  } catch (err) {
    console.error('DB Error:', err.message)
    return []
  }
}

// @desc    Get all list attempts
// @route   GET /api/lists-attempts?campaignId=
// @access  Private
exports.getListAttempts = asyncHandler(async (req, res, next) => {
  try {
    const { campaignId } = req.query
    const rows = await getAllListAttemptsRequest(campaignId)
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (err) {
    console.error('DB Error:', err.message)
    return next(new ErrorResponse('Error fetching lists', 500))
  }
})

// @desc    Get Update list attempt status
// @route   PATCH /api/list-attempts/n8n/:id
// @access  Private
exports.updateListAttemptsStatusById = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, ultravoxCallId } = req.body

    let queryUpdate, params
    if (status !== 'pending' && ultravoxCallId) {
      queryUpdate = `
        UPDATE list_attempts 
        SET status = ?, ultravox_call_id = ? 
        WHERE id = ?
      `
      params = [status, ultravoxCallId, id]
    } else {
      queryUpdate = `
        UPDATE list_attempts 
        SET status = ? 
        WHERE id = ?
      `
      params = [status, id]
    }

    // Update first
    const [updateResult] = await pool.query(queryUpdate, params)

    if (updateResult.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, msg: `list_attempt not found with id ${id}` })
    }

    // Fetch updated row with all necessary joins (replaces getListsChannelPhoneByCampaignAndIdRequest)
    const [rows] = await pool.query(
      `
      SELECT 
        ca.id,
        l.campaign_id,
        ca.list_id,
        ca.channel_id,
        ca.attempt_time AS created,
        ca.status,
        ca.notes,
        ca.ultravox_call_id AS ultravoxCallId,
        l.phone,
        m.name AS municipality,
        ch.name AS channel
      FROM list_attempts ca
      INNER JOIN lists l ON l.id = ca.list_id
      INNER JOIN municipalities m ON l.municipality_id = m.id
      INNER JOIN channels ch ON ca.channel_id = ch.id
      WHERE ca.id = ?
      `,
      [id]
    )

    const updated = rows[0]
    const campaignId = updated.campaign_id

    // Emit SSE event (non-blocking)
    emitCallUpdate(updated, campaignId)

    res.status(200).json({ success: true, data: updated })
  } catch (error) {
    console.error('DB Error:', error.message)
    res.status(500).json({ success: false, msg: error.message })
  }
}

// @desc    Update all list attempt status
// @route   PATCH /api/encuestas/list-queries/n8n/update-lists/:campaignId
// @access  Private
exports.updateListAttemptsStatusBulk = async (req, res, next) => {
  try {
    const { campaignId } = req.params

    // Step 1: Fetch only relevant attempts (pending/calling) + their Ultravox session
    const [attempts] = await pool.query(
      `
      SELECT 
        ca.id,
        c.campaign_id,
        c.phone,
        m.name AS municipality,
        ch.name AS channel,
        ca.status,
        ca.attempt_time AS created,
        ca.ultravox_call_id AS ultravoxCallId,
        us.end_reason
      FROM list_attempts ca
      INNER JOIN lists c ON ca.list_id = c.id
      INNER JOIN municipalities m ON c.municipality_id = m.id
      INNER JOIN channels ch ON ca.channel_id = ch.id
      LEFT JOIN ultravox_sessions us ON ca.ultravox_call_id = us.ultravox_call_id
      WHERE c.campaign_id = ?
        AND ca.status IN ('calling')   -- ✅ only those that might change
    `,
      [campaignId]
    )

    if (attempts.length === 0) {
      return res.status(200).json({ success: true, data: [] })
    }

    // Step 2: Build status updates
    const statusUpdates = []
    const eventsToEmit = []

    for (const row of attempts) {
      let newStatus = row.status

      if (row.ultravoxCallId) {
        if (row.end_reason === 'unjoined') newStatus = 'failed'
        else if (
          row.end_reason === 'hangup' ||
          row.end_reason === 'agent_hangup'
        ) {
          newStatus = 'answered'
        }
      }

      if (newStatus !== row.status) {
        statusUpdates.push({ id: row.id, newStatus })
        row.status = newStatus // sync for response/SSE
      }

      eventsToEmit.push({ callData: row, campaignId })
    }

    // Step 3: Bulk update with CASE WHEN
    if (statusUpdates.length > 0) {
      const caseSql = statusUpdates
        .map((s) => `WHEN ${s.id} THEN ${pool.escape(s.newStatus)}`)
        .join(' ')

      const idsSql = statusUpdates.map((s) => s.id).join(',')

      const updateQuery = `
        UPDATE list_attempts
        SET status = CASE id
          ${caseSql}
        END
        WHERE id IN (${idsSql})
      `

      await pool.query(updateQuery)
    }

    // Step 4: Emit SSE events asynchronously
    let i = 0
    const BATCH_SIZE = 50 // ✅ batch 50 at a time for throughput
    const emitNextBatch = () => {
      const batch = eventsToEmit.slice(i, i + BATCH_SIZE)
      for (const { callData, campaignId } of batch) {
        emitCallUpdate(callData, campaignId)
      }
      i += BATCH_SIZE
      if (i < eventsToEmit.length) {
        setImmediate(emitNextBatch)
      }
    }
    emitNextBatch()

    // Step 5: Respond fast
    res.status(200).json({ success: true, data: attempts })
  } catch (error) {
    console.error('DB Error:', error)
    res.status(500).json({ success: false, msg: error.message })
  }
}

exports.updateListAttemptsStatusByUltravoxCallId = async (req, res, next) => {
  const { ultravoxCallId } = req.params
  const { status, attemptTime } = req.body
  try {
    const [existing] = await pool.query(
      'SELECT * FROM list_attempts WHERE ultravox_call_id = ?',
      [ultravoxCallId]
    )

    if (existing.length === 0) {
      console.warn(`No list_attempt found for callId ${ultravoxCallId}`)
      return null
    }

    await pool.query(
      'UPDATE list_attempts SET status = ?, attempt_time = ? WHERE ultravox_call_id = ?',
      [status, attemptTime, ultravoxCallId]
    )

    const [callData] = await getListsChannelPhoneByCampaignAndIdRequest(
      existing[0].campaign_id,
      existing[0].id
    )

    emitCallUpdate(callData, existing[0].campaign_id)

    const [updated] = await pool.query(
      'SELECT * FROM list_attempts WHERE ultravox_call_id = ?',
      [ultravoxCallId]
    )
    res.status(200).json({ success: true, data: updated[0] })
  } catch (error) {
    res.status(401).json({ success: false, msg: error })
    //return next(new ErrorResponse(error, 500))
  }
}

exports.callStatusByUltravoxWebhookEvents = async (req, res, next) => {
  try {
    const { event, call } = req.body

    if (!call?.callId) return res.status(400).json({ error: 'Missing callId' })

    let status = null

    switch (event) {
      case 'call.started':
        status = 'calling'
        break
      case 'call.joined':
        status = 'answered'
        break
      case 'call.ended':
        status = call.status || 'failed' // success, failed, no_answer, etc.
        break
      default:
        return res.status(200).json({ message: 'Event ignored' })
    }

    await listsController.updateListAttemptStatusByUltravox(call.callId, status)

    res
      .status(200)
      .json({ success: true, data: { callId: call.callId, event, status } })
  } catch (err) {
    //next(err)
    res.status(401).json({ success: false, msg: error })
  }
}

// @desc    Process list to communicate with the different channels
// @route   POST /api/lists/process
// @access  Private
exports.processList = asyncHandler(async (req, res, next) => {
  const { campaignId } = req.params
  const channel_id = process.env.DEFAULT_CHANNEL

  const listIdsToInsertQuery = `SELECT id FROM lists WHERE id NOT IN (SELECT list_id FROM list_attempts);`

  const [resultIds] = await pool.query(listIdsToInsertQuery, [campaignId])
  const ids = resultIds.map((i) => i.id)
  if (ids.length > 0) {
    const values = ids.map((id) => [
      id,
      channel_id,
      new Date(),
      'pending',
      null,
    ])

    const insertQuery = `INSERT INTO list_attempts (list_id, channel_id, attempt_time, status, notes)
    VALUES ? ON DUPLICATE KEY UPDATE attempt_time = attempt_time`

    const [resultInsert] = await pool.query(insertQuery, [values])
    const { insertId } = resultInsert
    res.status(200).json({ success: true, data: insertId })
  } else {
    res.status(200).json({ success: true, count: 0, data: [] })
  }
})
