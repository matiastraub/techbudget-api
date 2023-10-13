const mongoose = require('mongoose')

const CategorySchema = new mongoose.Schema({
  name: {
    trim: true,
    type: String,
    unique: true,
    required: [true, 'Please add a category'],
    maxlength: [20, 'Description cannot be longer than 20 characters'],
  },
  description: {
    type: String,
    required: false,
    maxlength: [100, 'Description cannot be longer than 100 characters'],
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

module.exports = mongoose.model('Category', CategorySchema)
