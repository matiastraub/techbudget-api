const crypto = require('crypto')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const geocoder = require('../utils/geocoder')

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: false,
    required: false,
    trim: true,
    maxlength: [50, 'Name cannot be longer than 50 characters'],
  },
  lastname: {
    type: String,
    unique: false,
    required: false,
    trim: true,
    maxlength: [50, 'Name cannot be longer than 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    // eslint-disable-next-line no-useless-escape
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please fill a valid email address',
    ],
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  photo: {
    type: String,
    default: 'no-photo.jpg',
  },
  address: {
    type: String,
    required: true,
    maxlength: [500, 'Address cannot be longer than 500 characters'],
  },
  city: {
    type: String,
    required: true,
    maxlength: [25, 'City cannot be longer than 25 characters'],
  },
  location: {
    // geoJSON Point
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
      index: '2dsphere',
    },
    formattedAddress: String,
    street: String,
    city: String,
    state: String,
    country: String,
    zipcode: String,
  },
  slug: String,
  description: {
    type: String,
    required: false,
    maxlength: [500, 'Name cannot be longer than 500 characters'],
  },
  ranking: {
    type: Number,
    required: false,
    min: [0, 'Must be at least 0'],
    max: [5, 'Must not be greater than 5'],
  },
  sport: {
    type: String,
    required: false,
    enum: ['soccer', 'hockey', 'volleyball'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Encrypt password unsing bcrypt
// eslint-disable-next-line func-names
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next()
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// Add geolocation
// eslint-disable-next-line func-names
UserSchema.pre('save', async function (next) {
  const addressCity = `${this.address}, ${this.city}`
  const loc = await geocoder.geocode(addressCity)
  this.location = {
    type: 'Point',
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    street: loc[0].streetName,
    city: loc[0].city,
    state: loc[0].stateCode,
    zipcode: loc[0].zipcode,
    country: loc[0].countryCode,
  }
  next()
})

// Sign JWT and return
// eslint-disable-next-line func-names
UserSchema.methods.getSignedJwtToken = function () {
  // eslint-disable-next-line no-underscore-dangle
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  })
}

// Match user entered password to hashed password in database
// eslint-disable-next-line func-names
UserSchema.methods.matchPassword = async function (enteredPassword) {
  const result = await bcrypt.compare(enteredPassword, this.password)
  return result
}

// eslint-disable-next-line func-names
UserSchema.methods.getResetPasswordToken = async function () {
  // Generate the token
  const resetToken = crypto.randomBytes(20).toString('hex')
  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')
  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000
  return resetToken
}

module.exports = mongoose.model('User', UserSchema)
