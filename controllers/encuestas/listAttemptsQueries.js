const ErrorResponse = require('../../utils/ErrorResponse')
const asyncHandler = require('../../middleware/async')
const pool = require('../../config/mysql')

exports.getListAttemptsStatus = asyncHandler(async (req, res, next) => {
  const query = `SELECT l.phone,la.status, us.ultravox_call_id, us.end_reason, us.created, us.joined, us.ended
FROM ultravox_sessions us
RIGHT JOIN list_attempts la ON la.ultravox_call_id = us.ultravox_call_id
RIGHT JOIN lists l ON  l.id = la.list_id;`
  const [rows] = await pool.query(query)
  if (rows.length === 0) {
    return next(new ErrorResponse('List attempt not found', 404))
  }

  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows,
  })
})

const getAllListAttemptsRequestByStatus = async (status) => {
  let query = `SELECT ca.id, c.phone,  m.name AS municipality,ch.name AS channel,
      ca.status, ca.attempt_time AS created,ca.ultravox_call_id AS ultravoxCallId
      FROM list_attempts ca
      INNER JOIN lists c ON ca.list_id = c.id
      INNER JOIN municipalities m ON c.municipality_id = m.id
      INNER JOIN channels ch ON ca.channel_id = ch.id`

  try {
    if (['answered', 'pending', 'failed'].includes(status)) {
      query = `${query} WHERE ca.status = ?`
      let [results] = await pool.query(query, [status])
      return results
    } else {
      let [results] = await pool.query(query)
      return results
    }
  } catch (err) {
    console.error('DB Error:', err.message)
    return []
  }
}

exports.getListAttemptsByStatus = async (req, res, next) => {
  const data = await getAllListAttemptsRequestByStatus(req?.params?.status)
  return res.status(200).json({ success: true, count: data.length, data })
}
