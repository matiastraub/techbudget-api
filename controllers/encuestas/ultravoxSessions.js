const ErrorResponse = require('../../utils/ErrorResponse')
const asyncHandler = require('../../middleware/async')
const pool = require('../../config/mysql')
const { getCallRequest } = require('../agents')

const DEFAULT_CAMPAIGN_ID = 1

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

    if (data.length > 0) {
      const values = data.map((item) => [
        item.billedDuration || null,
        DEFAULT_CAMPAIGN_ID, // campaign_id fixed to 1
        item.created || null,
        item.endReason || null,
        item.ended || null,
        item.joined || null,
        item.shortSummary.substr(
          0,
          item.shortSummary.length > 250 ? 250 : item.shortSummary.length
        ) || null,
        item.summary.substr(
          0,
          item.summary.length > 700 ? 700 : item.summary.length
        ) || null,
        item.callId || null,
      ])
      const insertQuery = `INSERT INTO ultravox_sessions (billed_duration, campaign_id, created, end_reason, ended, joined, short_summary, summary, ultravox_call_id) VALUES ? `
      const [resultInsert] = await pool.query(insertQuery, [values])
      const { insertId } = resultInsert
      res.status(200).json({ success: true, data: insertId })
    }

    // res.status(200).json({ success: true, inserted: data.length })
  } catch (error) {
    res.status(401).json({ success: false, data: error })
  }
}
