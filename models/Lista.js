const mongoose = require('mongoose')

const ListaSchema = new mongoose.Schema({
  telefono: {
    type: String,
    unique: true,
    trim: true,
    maxlength: [50, 'Name cannot be longer than 50 characters'],
  },
  comuna: {
    type: String,
    unique: false,
    trim: true,
    maxlength: [50, 'Name cannot be longer than 50 characters'],
  },
  canal: {
    type: String,
    unique: false,
    trim: true,
    maxlength: [50, 'Name cannot be longer than 50 characters'],
    required: true,
    enum: ['Telegram', 'WhatsApp', 'Telefono', 'SMS'],
  },
  contactado: {
    type: Boolean,
    unique: false,
    trim: true,
    default: false,
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

module.exports = mongoose.model('Lista', ListaSchema)
