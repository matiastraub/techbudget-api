// controllers/listAttempts.js
const ErrorResponse = require('../../utils/ErrorResponse')
const asyncHandler = require('../../middleware/async')
const pool = require('../../config/mysql')

const DEFAULT_CAMPAIGN_ID = 1
const DEFAULT_CHANNEL = 1

// @desc    Get list attempt by Id
// @route   GET /api/encuestas/list-attempts/:id
// @access  Private
exports.getListAtttempt = asyncHandler(async (req, res, next) => {
  //ultravox_call_id
  console.log('getListAttempt', req.params)
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

exports.updateListAttemptStatusByUltravox = async (ultravoxCallId, status) => {
  const [existing] = await pool.query(
    'SELECT * FROM list_attempts WHERE ultravox_call_id = ?',
    [ultravoxCallId]
  )

  if (existing.length === 0) {
    console.warn(`No list_attempt found for callId ${ultravoxCallId}`)
    return null
  }

  await pool.query(
    'UPDATE list_attempts SET status = ? WHERE ultravox_call_id = ?',
    [status, ultravoxCallId]
  )

  const [updated] = await pool.query(
    'SELECT * FROM list_attempts WHERE ultravox_call_id = ?',
    [ultravoxCallId]
  )
  return updated[0]
}

exports.updateListAttemptStatusById = async (
  id,
  status,
  ultravoxCallId,
  next
) => {
  const [existing] = await pool.query(
    'SELECT * FROM list_attempts WHERE id = ?',
    [id]
  )
  if (existing.length === 0) {
    return next(new ErrorResponse(`Municipality not found with id ${id}`, 404))
  }
  const sql = `UPDATE list_attempts SET status = ?, ultravox_call_id = ? WHERE id = ?`
  await pool.query(sql, [status, ultravoxCallId, id])
  const [rows] = await pool.query('SELECT * FROM list_attempts WHERE id = ?', [
    id,
  ])
  return rows[0]
}

// @desc    Get all list attempts
// @route   GET /api/lists/attempts
// @access  Private
exports.getListAttempts = asyncHandler(async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT ca.id, c.phone,  m.name AS municipality,ch.name AS channel,ca.status, ca.attempt_time AS created
      FROM list_attempts ca
      INNER JOIN lists c ON ca.list_id = c.id
      INNER JOIN municipalities m ON c.municipality_id = m.id
      INNER JOIN channels ch ON ca.channel_id = ch.id
    `)

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (err) {
    console.error('DB Error:', err)
    return next(new ErrorResponse('Error fetching lists', 500))
  }
})

// @desc    Get Update list attempt status
// @route   GET /api/lists/attempts
// @access  Private
exports.updateListAttemptStatus = asyncHandler(async (req, res, next) => {
  //const { id } = req.params
  const { status, id } = req.body

  const updated = this.updateListAttemptStatusById(id, status, next)

  res.status(200).json({
    success: true,
    data: updated,
  })
})

// @desc    Process list to communicate with the different channels
// @route   POST /api/lists/process
// @access  Private
exports.processList = asyncHandler(async (req, res, next) => {
  campaign_id = DEFAULT_CAMPAIGN_ID
  channel_id = DEFAULT_CHANNEL

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
    res.status(404).json({ success: false, msg: 'Not Found' })
  }
})
