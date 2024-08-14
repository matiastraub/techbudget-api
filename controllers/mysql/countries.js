const ErrorResponse = require('../../utils/ErrorResponse')
const asyncHandler = require('../../middleware/async')
const mysql = require('../../config/mysql')

// @desc    Get all Countries
// @route   GET /api/countries/
// @access  Private
exports.getCountries = asyncHandler((req, res, next) => {
  //TODO: Temporary raw request as placeholder to query from a MySQL database
  const sql = 'SELECT * FROM `countries`'

  mysql.query(sql, (err, data) => {
    if (err) next(new ErrorResponse(`Not found`, 404))
    return res.status(200).json({ success: true, count: data.length, data })
  })
})
