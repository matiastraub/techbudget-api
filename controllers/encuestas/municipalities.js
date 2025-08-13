const ErrorResponse = require('../../utils/ErrorResponse')
const asyncHandler = require('../../middleware/async')
const pool = require('../../config/mysql')

// @desc    Get all countries
// @route   GET /api/countries/
// @access  Private
exports.getMunicipalities = asyncHandler(async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM municipalities')

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

// @desc    Get single municipality by ID
// @route   GET /api/municipalities/:id
// @access  Private
exports.getMunicipality = asyncHandler(async (req, res, next) => {
  const { id } = req.params
  const [rows] = await pool.query('SELECT * FROM municipalities WHERE id = ?', [
    id,
  ])

  if (rows.length === 0) {
    return next(new ErrorResponse(`Municipality not found with id ${id}`, 404))
  }

  res.status(200).json({
    success: true,
    data: rows[0],
  })
})

// @desc    Create new municipality
// @route   POST /api/municipalities/
// @access  Private
exports.createMunicipality = asyncHandler(async (req, res, next) => {
  const { name, district_id, region_id } = req.body

  const sql = `INSERT INTO municipalities (name, distric_id, region_id)
               VALUES (?, ?, ?)`

  const [result] = await pool.query(sql, [name, district_id, region_id])

  const [rows] = await pool.query('SELECT * FROM municipalities WHERE id = ?', [
    result.insertId,
  ])

  res.status(201).json({
    success: true,
    data: rows[0],
  })
})

// @desc    Update municipality by ID
// @route   PUT /api/municipalities/:id
// @access  Private
exports.updateMunicipality = asyncHandler(async (req, res, next) => {
  const { id } = req.params
  const { name, district_id, region_id } = req.body

  // Check municipality exists
  const [existing] = await pool.query(
    'SELECT * FROM municipalities WHERE id = ?',
    [id]
  )
  if (existing.length === 0) {
    return next(new ErrorResponse(`Municipality not found with id ${id}`, 404))
  }

  const sql = `UPDATE municipalities
               SET name = ?, district_id = ?, region_id = ?
               WHERE id = ?`

  await pool.query(sql, [name, district_id, region_id, id])

  const [rows] = await pool.query('SELECT * FROM municipalities WHERE id = ?', [
    id,
  ])

  res.status(200).json({
    success: true,
    data: rows[0],
  })
})

// @desc    Delete municipality by ID
// @route   DELETE /api/municipalities/:id
// @access  Private
exports.deleteMunicipality = asyncHandler(async (req, res, next) => {
  const { id } = req.params

  const [existing] = await pool.query(
    'SELECT * FROM municipalities WHERE id = ?',
    [id]
  )
  if (existing.length === 0) {
    return next(new ErrorResponse(`Municipality not found with id ${id}`, 404))
  }

  await pool.query('DELETE FROM municipalities WHERE id = ?', [id])

  res.status(200).json({
    success: true,
    data: {},
    message: `Municipality with id ${id} deleted`,
  })
})
