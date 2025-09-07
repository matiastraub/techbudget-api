const ErrorResponse = require('../../utils/ErrorResponse')
const asyncHandler = require('../../middleware/async')
const pool = require('../../config/mysql')

exports.getListsChannelPhone = asyncHandler(async (req, res, next) => {
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
                LEFT JOIN candidates ca ON ca.id = us.candidate_id`
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

const generalQuery =
  () => `SELECT l.phone, la.id, la.list_id, la.status,la.ultravox_call_id,us.candidate_id,
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
                LEFT JOIN candidates ca ON ca.id = us.candidate_id`

exports.getListsChannelPhoneByCampaignAndIdRequest = async (
  campaignId,
  listAttemptId
) => {
  try {
    const query = `${generalQuery()} WHERE l.campaign_id = ? AND la.id = ?`
    console.log('query', query)
    console.log('params', [campaignId, listAttemptId])
    const [rows] = await pool.query(query, [campaignId, listAttemptId])
    return rows
  } catch (error) {
    console.error('DB Error:', error.message)
    return []
  }
}

exports.getListsChannelPhoneByCampaignRequest = async (campaignId) => {
  try {
    const query = `${generalQuery()} WHERE l.campaign_id = ?`
    const [rows] = await pool.query(query, [campaignId])
    return rows
  } catch (error) {
    console.error('DB Error:', error.message)
    return []
  }
}

exports.getListsChannelPhoneByCampaign = asyncHandler(
  async (req, res, next) => {
    const { id } = req.params
    const rows = await exports.getListsChannelPhoneByCampaignRequest(id)
    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    })
  }
)

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
