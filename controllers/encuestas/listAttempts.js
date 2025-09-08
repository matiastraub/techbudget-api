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

const getAllListAttemptsRequest = async () => {
  try {
    const [rows] = await pool.query(`
      SELECT ca.id, c.phone,  m.name AS municipality,ch.name AS channel,
      ca.status, ca.attempt_time AS created,ca.ultravox_call_id AS ultravoxCallId
      FROM list_attempts ca
      INNER JOIN lists c ON ca.list_id = c.id
      INNER JOIN municipalities m ON c.municipality_id = m.id
      INNER JOIN channels ch ON ca.channel_id = ch.id
    `)

    return rows
  } catch (err) {
    console.error('DB Error:', err.message)
    return []
  }
}

// @desc    Get all list attempts
// @route   GET /api/lists/attempts
// @access  Private
exports.getListAttempts = asyncHandler(async (req, res, next) => {
  try {
    const rows = await getAllListAttemptsRequest()
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
// @route   GET /api/lists/attempts
// @access  Private
exports.updateListAttemptsStatusById = async (req, res, next) => {
  //First time status is calling from N8N

  try {
    const { id } = req.params
    const { status, ultravoxCallId } = req.body
    let query, params
    if (status !== 'pending' && ultravoxCallId) {
      query = `UPDATE list_attempts SET status = ?,ultravox_call_id  = ? WHERE id = ?`
      params = [status, ultravoxCallId, id]
    } else {
      query = `UPDATE list_attempts SET status = ? WHERE id = ?`
      params = [status, id]
    }

    const [existing] = await pool.query(
      'SELECT * FROM list_attempts WHERE id = ?',
      [id]
    )
    if (existing.length === 0) {
      return next(
        new ErrorResponse(`Municipality not found with id ${id}`, 404)
      )
    }

    const querySelect = `SELECT la.id,l.campaign_id, la.list_id,la.channel_id, la.attempt_time, la.status,
                          la.notes, la.ultravox_call_id FROM list_attempts la 
                          INNER JOIN lists l ON l.id = la.list_id
                          WHERE la.id = ?`
    await pool.query(query, params)
    const [rows] = await pool.query(querySelect, [id])

    const campaignId = rows.campaign_id
    const callData = await getListsChannelPhoneByCampaignAndIdRequest(
      campaignId,
      id
    )

    emitCallUpdate(callData, campaignId)
    res.status(200).json({ success: true, data: rows[0] })
  } catch (error) {
    console.error('DB Error:', error.message)
    //return next(new ErrorResponse('Error updating', 500))
    res.status(401).json({ success: false, msg: error.message })
  }
}

exports.updateListAttemptsStatusBulk = async (req, res, next) => {
  try {
    const updates = await getAllListAttemptsRequest()
    const ultravoxSessions = await getUltravoxSessionsRequest()

    if (!Array.isArray(updates) || updates.length === 0) {
      return next(new ErrorResponse('No updates provided', 400))
    }

    let call = {}
    let newStatus = ''
    for (const { id, status, ultravoxCallId } of updates) {
      let query, params
      call = ultravoxSessions.find((c) => c.ultravox_call_id === ultravoxCallId)

      if (['pending', 'calling'].includes(status) && ultravoxCallId) {
        if (call?.end_reason === 'unjoined') {
          newStatus = 'failed'
        } else if (call?.end_reason === 'hangup') {
          newStatus = 'answered'
        }
        query = `UPDATE list_attempts SET status = ?, ultravox_call_id = ? WHERE id = ?`
        params = [newStatus, ultravoxCallId, id]
      } else {
        query = `UPDATE list_attempts SET status = ? WHERE id = ?`
        params = [status, id]
      }

      // Check existence
      const [existing] = await pool.query(
        'SELECT * FROM list_attempts WHERE id = ?',
        [id]
      )
      if (existing.length === 0) {
        return next(
          new ErrorResponse(`list_attempt not found with id ${id}`, 404)
        )
      }

      await pool.query(query, params)
    }

    // Return updated rows
    const ids = updates.map((u) => u.id)
    const [rows] = await pool.query(
      `SELECT * FROM list_attempts WHERE id IN (?)`,
      [ids]
    )

    res.status(200).json({ success: true, data: rows })
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
  const campaign_id = process.env.DEFAULT_CAMPAIGN_ID
  const channel_id = process.env.DEFAULT_CHANNEL

  const listIdsToInsertQuery = `SELECT id FROM lists WHERE id NOT IN (SELECT list_id FROM list_attempts);`

  const [resultIds] = await pool.query(listIdsToInsertQuery, [campaign_id])
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
