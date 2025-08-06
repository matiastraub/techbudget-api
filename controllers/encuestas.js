const ErrorResponse = require('../utils/ErrorResponse')
const asyncHandler = require('../middleware/async')
const Lista = require('../models/Lista')

// @desc    Get all transactions
// @route   GET /api/v1/transactions
// @access  Private
exports.getEncuestas = asyncHandler(async (req, res) => {
  res.status(200).json(res.advancedQueries)
})

// @desc    Upload a transaction file (Excel from the front-end)
// @route   POST /api/v1/transactions/upload
// @access  Private
exports.uploadEncuestaFile = asyncHandler(async (req, res, next) => {
  const transactions = req.body
  // Check max size
  if (transactions.length > process.env.MAX_TRANSACTIONS_UPLOAD) {
    return next(
      new ErrorResponse(`Upload limit reached ${transactions.length}`, 400)
    )
  }

  let transArray = []
  transactions.forEach((row) => {
    row.telefono = row?.Telefono || row?.telefono
    row.comuna = row?.Comuna || row?.comuna || ''
    row.canal = row?.Canal || row?.canal || ''
    row.user = req.user.id
    transArray.push(row)
    console.log('trans', row)
  })
  const listaCreated = await Lista.insertMany(transArray)
  console.log('listaCreated', listaCreated)
  return res.status(201).json({ success: true, data: listaCreated })
})
