const mongoose = require('mongoose')

const TransactionSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: false,
    trim: true,
    maxlength: [50, 'Name cannot be longer than 50 characters'],
  },
  slug: String,
  description: {
    type: String,
    required: false,
    trim: true,
    maxlength: [500, 'Name cannot be longer than 500 characters'],
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Must be at least 0'],
  },
  cost: {
    type: String,
    required: true,
    enum: ['Var', 'Fix'],
  },
  source: {
    type: String,
    required: false,
    default: 'Unknown',
    //Change
    enum: ['Cash', 'Debit', 'Credit', 'Travel', 'BMO', 'TD', 'Unknown'],
  },
  type: {
    type: String,
    required: false,
    default: 'Expenses',
    //Change
    enum: ['Expenses', 'Transaction', 'Revenue'],
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    default: '654e509d1a373147025f3d6f',
    required: false,
  },
  userCategory: {
    type: String,
    required: false,
  },
  date: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
})

module.exports = mongoose.model('Transaction', TransactionSchema)
