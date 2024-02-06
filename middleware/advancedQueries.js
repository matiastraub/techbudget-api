const config = require('../config/queries')

const advancedQueries = (model, populate) => async (req, res, next) => {

  const reqQuery = { ...req.query }

  // Fields to exclude
  const removeFields = ['select', 'sort', 'page', 'limit']
  
  // Loop over removeFields and delete them reqQuery
  removeFields.forEach((param) => delete reqQuery[param])

  // Create query string
  let queryStr = JSON.stringify(reqQuery)

  // Create operators ($gt, $gte, $lt, $le, in)
  queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`)

  // Match user with model
  const parsed =  JSON.parse(queryStr)

  let query = model.find({ user: req.user.id,...parsed })

  // Select
  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ')
    query = query.select(fields)
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ')
    query = query.sort(sortBy)
  } else {
    query = query.sort('-createdAt')
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1
  const limit = parseInt(req.query.limit, 10) || config.PAGE_LIMIT

  const startIndex = (page - 1) * limit
  const endIndex = page * limit
  const total = await model.countDocuments()

  query = query.skip(startIndex).limit(limit)

  if (populate) {
    query = query.populate(populate[0], populate[1] || '')
  }

  // Find transactions
  const results = await query

  // Pagination result
  const pagination = { page: 1, limit }

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    }
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    }
  }
  res.advancedQueries = {
    success: true,
    count: results.length,
    data: results,
  }
  next()
}

module.exports = advancedQueries
