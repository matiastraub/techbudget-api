const ErrorResponse = require('../../utils/ErrorResponse')
const asyncHandler = require('../../middleware/async')
const pool = require('../../config/mysql')

exports.getListAttemptsStatus = asyncHandler(async (req, res, next) => {
  const query = `SELECT l.phone,la.status, us.ultravox_call_id, us.end_reason, us.created, us.joined, us.ended
FROM ultravox_sessions us
RIGHT JOIN list_attempts la ON la.ultravox_call_id = us.ultravox_call_id
RIGHT JOIN lists l ON  l.id = la.list_id;`
  const [rows] = await pool.query(query)
  console.log('rows: ', rows)
  if (rows.length === 0) {
    return next(new ErrorResponse('List attempt not found', 404))
  }

  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows,
  })
})
