const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')

const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  updateTransactions,
  deleteTransaction,
  uploadTransactionFile,
} = require('../controllers/transactions')

const Transaction = require('../models/Transaction')
const advancedQueries = require('../middleware/advancedQueries')

router
  .route('/')
  .get(
    protect,
    advancedQueries(Transaction, ['category', 'name']),
    getTransactions
  )
  .post(protect, createTransaction)
  .put(protect,updateTransactions)

router
  .route('/:id')
  .get(protect, getTransaction)
  .put(protect, updateTransaction)
  .delete(protect, deleteTransaction)

router.route('/upload').post(protect, uploadTransactionFile)

module.exports = router
