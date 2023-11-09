const ErrorResponse = require('../utils/ErrorResponse')
const asyncHandler = require('../middleware/async')
const Category = require('../models/Category')

// @desc    Get all categories
// @route   GET /api/v1/categories/:user
// @access  Private
exports.getCategories = asyncHandler(async (req, res) => {
  res.status(200).json(res.advancedQueries)
})

// @desc    Get a given category
// @route   GET /api/v1/categories/:id
// @access  Private
exports.getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id).select('-user')
  if (!category) {
    next(new ErrorResponse(`Not found with id: ${req.params.id}`, 404))
  }
  res.status(200).json({ success: true, data: category })
})

// @desc    Create one or many categories
// @route   POST /api/v1/categories
// @access  Private
exports.createCategory = asyncHandler(async (req, res) => {
  if (Array.isArray(req.body)) {
    req.body.forEach((category) => {
      category.user = req.user.id
    })
    const categories = await Category.insertMany(req.body)
    res.status(201).json({ success: true, data: categories })
  } else {
    req.body.user = req.user.id
    const category = await Category.create(req.body)
    res.status(201).json({ success: true, data: category })
  }
})

// @desc    Update a given category
// @route   PUT /api/v1/transactions/:id
// @access  Private
exports.updateCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
  if (!category) {
    next(new ErrorResponse(`Not found with id: ${req.params.id}`, 404))
  }
  res.status(200).json({ success: true, data: category })
})

// @desc    Delete a given category
// @route   DELETE /api/v1/categories/:id
// @access  Private
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id)
  if (!category) {
    next(new ErrorResponse(`Not found with id: ${req.params.id}`, 404))
  }
  res.status(200).json({ success: true, data: {} })
})
