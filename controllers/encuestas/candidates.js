const ErrorResponse = require('../../utils/ErrorResponse')
const asyncHandler = require('../../middleware/async')
const pool = require('../../config/mysql')

exports.candidatesRequest = async () => {
  try {
    const query = `SELECT c.id, c.short_name
                    FROM campaign_candidates cc
                    INNER JOIN candidates c ON cc.candidate_id = c.id
                    WHERE cc.campaign_id = ${process.env.DEFAULT_CAMPAIGN_ID};`
    const [rows] = await pool.query(query)
    return rows
  } catch (error) {
    console.error('Error: ', error.message)
    return []
  }
}
