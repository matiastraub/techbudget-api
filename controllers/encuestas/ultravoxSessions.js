const ErrorResponse = require('../../utils/ErrorResponse')
const asyncHandler = require('../../middleware/async')
const pool = require('../../config/mysql')
const { getCallRequest } = require('../agents')

exports.getUltravoxSessions = asyncHandler(async (req, res, next) => {
  try {
    const sql = `SELECT * FROM ultravox_sessions`
    const [rows] = await pool.query(sql)

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

exports.updateUltravoxSessions = async (req, res, next) => {
  try {
    const calls = await getCallRequest()
    const { data } = calls
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ success: false, msg: 'No data received' })
    }

    const sqlGet = `SELECT * FROM ultravox_sessions`
    const [mySessionUltraVox] = await pool.query(sqlGet)

    // Extract IDs
    const getIds = data.map((i) => i.callId)
    const sessionIds = mySessionUltraVox.map((i) => i.ultravox_call_id)

    // 1. Check if identical (ignoring order)
    const areIdentical =
      getIds.length === sessionIds.length &&
      getIds.every((id) => sessionIds.includes(id))

    if (areIdentical) {
      res.status(200).json({
        success: true,
        count: 0,
        data: [],
      })
    }

    // 2. Find missing ones
    const missingIds = getIds.filter((id) => !sessionIds.includes(id))

    // 3. Insert missing (example: pushing into mySessionUltraVox)
    if (missingIds.length > 0) {
      const missingCalls = data.filter((call) =>
        missingIds.includes(call.callId)
      )

      // Prepare values for bulk insert
      const values = missingCalls.map((item) => [
        item.billedDuration || null,
        process.env.DEFAULT_CAMPAIGN_ID, // fixed campaign_id
        item.created || null,
        item.endReason || null,
        item.ended || null,
        item.joined || null,
        item.shortSummary ? item.shortSummary.substring(0, 250) : null,
        item.summary ? item.summary.substring(0, 700) : null,
        item.callId || null,
      ])
      const insertQuery = `INSERT INTO ultravox_sessions (billed_duration, campaign_id, created, end_reason, ended, joined, short_summary, summary, ultravox_call_id) VALUES ? `
      const [resultInsert] = await pool.query(insertQuery, [values])
      const { insertId } = resultInsert
      res
        .status(200)
        .json({ success: true, count: data.length, data: insertId })
    }
  } catch (error) {
    res.status(401).json({ success: false, data: error })
  }
}
