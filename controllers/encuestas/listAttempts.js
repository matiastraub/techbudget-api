// controllers/listAttempts.js
const ErrorResponse = require('../../utils/ErrorResponse')
const asyncHandler = require('../../middleware/async')
const pool = require('../../config/mysql')

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
