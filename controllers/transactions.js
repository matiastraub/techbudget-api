const ErrorResponse = require('../utils/ErrorResponse')
const asyncHandler = require('../middleware/async')
const Transaction = require('../models/Transaction')
const Category = require('../models/Category')

const getUniqueCategories = (reqTransactions) => {
  const categories = []
  reqTransactions.forEach((item) => {
    categories.push(item.category)
  })
  return [...new Set(categories)]
}

// @desc    Get all transactions
// @route   GET /api/v1/transactions
// @access  Private
exports.getTransactions = asyncHandler(async (req, res) => {
  res.status(200).json(res.advancedQueries)
})

// @desc    Get a given transaction
// @route   GET /api/v1/transactions/:id
// @access  Private
exports.getTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findById(
    { user: req.user.id },
    req.params.id
  )
  if (!transaction) {
    next(new ErrorResponse(`Not found with id: ${req.params.id}`, 404))
  }
  res.status(200).json({ sucess: true, data: transaction })
})

// @desc    Create a transaction
// @route   POST /api/v1/transactions
// @access  Private
exports.createTransaction = asyncHandler(async (req, res) => {
  req.body.user = req.user.id
  const category = await Category.findOne({
    user: req.body.user,
    name: req.body.category,
  })
  req.body.category = category.id
  const transaction = await Transaction.create(req.body)
  return res.status(201).json({ sucess: true, data: transaction })
})

// @desc    Upload a transaction file (Excel from the front-end)
// @route   POST /api/v1/transactions/upload
// @access  Private
exports.uploadTransactionFile = asyncHandler(async (req, res, next) => {
  const categories = getUniqueCategories(req.body)
  const categoryResp = await Category.find({ user: req.user.id })
  const mappedCategories = categoryResp.map((categ) => categ.name)

  const difference = categories.filter((x) => !mappedCategories.includes(x))

  if (difference.length === 1) {
    return next(
      new ErrorResponse(`this category does not exist ${difference[0]}`, 500)
    )
  }
  if (difference.length) {
    return next(
      new ErrorResponse(
        `These categories do not exist ${difference.join(',')}`,
        500
      )
    )
  }

  // Check max size
  if (req.body.length > process.env.MAX_TRANSACTIONS_UPLOAD) {
    return next(
      new ErrorResponse(`Upload limit reached ${req.body.length}`, 400)
    )
  }

  req.body.forEach((element) => {
    element.category = categoryResp.find(
      (cat) => cat.name === element.category
    ).id
    element.user = req.user.id
  })

  const transactions = await Transaction.insertMany(req.body)
  return res.status(201).json({ sucess: true, data: transactions })
})

// @desc    Update a given transaction
// @route   PUT /api/v1/transactions/:id
// @access  Private
exports.updateTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  )
  if (!transaction) {
    next(new ErrorResponse(`Not found with id: ${req.params.id}`, 404))
  }
  res.status(200).json({ sucess: true, data: transaction })
})

// @desc    Delete a given transaction
// @route   DELETE /api/v1/transactions/:id
// @access  Private
exports.deleteTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findByIdAndDelete(req.params.id)
  if (!transaction) {
    next(new ErrorResponse(`Not found with id: ${req.params.id}`, 404))
  }
  res.status(200).json({ sucess: true, data: {} })
})
