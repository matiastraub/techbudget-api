const ErrorResponse = require('../utils/ErrorResponse')
const asyncHandler = require('../middleware/async')
const Transaction = require('../models/Transaction')
const Category = require('../models/Category')
const User = require('../models/User')
const { predictTransactionCost } = require('../utils/predictors')

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
  res.status(200).json({ success: true, data: transaction })
})

// @desc    Create a transaction
// @route   POST /api/v1/transactions
// @access  Private
exports.createTransaction = asyncHandler(async (req, res) => {
  req.body.user = req.user.id
  const categories = await Category.find()
  const transCategory = req.body.category
  const categoryId = categories.find(
    (category) => category.name === transCategory
  )?.id
  req.body.category = categoryId ? categoryId : undefined
  const transaction = await Transaction.create(req.body)
  //Add Category To user
  await addCategoryToUser(req)
  return res.status(201).json({ success: true, data: transaction })
})

const addCategoryToUser = async (req) => {
  const user = await User.findOne({ email: req.user.email })
  const transCategory = req.body.userCategory
  if (!user.categories.includes(transCategory)) {
    if (transCategory) {
      user.categories.push(transCategory)
      user.save()
    }
  }
}

// @desc    Upload a transaction file (Excel from the front-end)
// @route   POST /api/v1/transactions/upload
// @access  Private
exports.uploadTransactionFile = asyncHandler(async (req, res, next) => {
  const categoriesReq = await Category.find()
  const transactions = req.body
  const categories = getUniqueCategories(transactions)

  const difference = categories.filter(
    (value) => req.user.categories.indexOf(value) === -1
  )

  if (difference.length === 1) {
    return next(
      new ErrorResponse(`This category does not exist: ${difference[0]}`, 500)
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
  if (transactions.length > process.env.MAX_TRANSACTIONS_UPLOAD) {
    return next(
      new ErrorResponse(`Upload limit reached ${transactions.length}`, 400)
    )
  }

  transactions.forEach((trans) => {
    trans.userCategory = trans.category
    trans.cost = predictTransactionCost(trans.cost, trans.userCategory)
    //TODO: Check if necessary
    trans.category = categoriesReq.find(
      (cat) => cat.name === trans.userCategory
    ).id
    trans.user = req.user.id
  })

  const transactionsCreated = await Transaction.insertMany(transactions)
  return res.status(201).json({ success: true, data: transactionsCreated })
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
  res.status(200).json({ success: true, data: transaction })
})

// @desc    Update an array of transaction objects
// @route   PUT /api/v1/transactions
// @access  Private
exports.updateTransactions = asyncHandler(async (req, res, next) => {
  const categories = await Category.find()
  const objects = req.body
  objects.forEach(async (object) => {
    object.amount = parseFloat(object.amount)
    const transaction = await Transaction.findById(object.id)
    if (!transaction) {
      return next(new ErrorResponse(`Not found with id: ${obj.id}`, 404))
    }
    const categoryId = categories.find(
      (category) => category.name === object.category
    ).id
    object.category = categoryId
    const trans = await Transaction.findByIdAndUpdate(object.id, object, {
      new: true,
      runValidators: true,
    })
    if (!trans) {
      return next(new ErrorResponse(`Not found with id: ${obj.id}`, 404))
    }
  })
  res.status(200).json({ success: true, data: objects })
})

// @desc    Delete a given transaction
// @route   DELETE /api/v1/transactions/:id
// @access  Private
exports.deleteTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await Transaction.findByIdAndDelete(req.params.id)
  if (!transaction) {
    next(new ErrorResponse(`Not found with id: ${req.params.id}`, 404))
  }
  res.status(200).json({ success: true, data: {} })
})
