//const ErrorResponse = require('../../utils/ErrorResponse')
const asyncHandler = require('../../middleware/async')
const pool = require('../../config/mysql')

exports.getCampaignsRequest = asyncHandler(async (req, res, next) => {
  const query = `SELECT e.name, e.level, e.geo_level,e.prompt, ct.name as type
                    FROM campaigns e
                    INNER JOIN campaign_types ct ON ct.id = e.campaign_type_id`
  const [rows] = await pool.query(query)
  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows,
  })
})

exports.getCampaignsRequestById = asyncHandler(async (req, res, next) => {
  const { id } = req.params
  const query = `SELECT e.name, e.level, e.geo_level,e.prompt, ct.name as type
                    FROM campaigns e
                    INNER JOIN campaign_types ct ON ct.id = e.campaign_type_id
                    WHERE e.campaign_id = ${id};`
  const [rows] = await pool.query(query)
  res.status(200).json({
    success: true,
    count: rows.length,
    data: rows,
  })
})
