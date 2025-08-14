const ErrorResponse = require('../../utils/ErrorResponse')
const asyncHandler = require('../../middleware/async')
const pool = require('../../config/mysql')

// @desc    Get all countries
// @route   GET /api/countries/
// @access  Private
exports.getCountries = asyncHandler(async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM countries')

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (err) {
    console.error('DB Error:', err)
    return next(new ErrorResponse('Error fetching countries', 500))
  }
})
