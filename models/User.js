const crypto = require('crypto')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const geocoder = require('../utils/geocoder')

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: false,
    required: true,
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
    lowercase: true,
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
  verifyEmailToken: String,
  verifyEmailExpire: Date,
  isVerified: {
    type: Boolean,
    default: false,
  },
  photo: {
    type: String,
    default: 'no-photo.jpg',
  },
  address: {
    type: String,
    required: false,
    maxlength: [500, 'Address cannot be longer than 500 characters'],
  },
  city: {
    type: String,
    required: false,
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
  createdAt: {
    type: Date,
    immutable: true,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  categories: [
    {
      type: String,
    },
  ],
  pages: {
    required: false,
    type: [
      {
        type: String,
        enum: [
          'dashboard',
          'addtransaction',
          'expenses',
          'editexpenses',
          'crypto',
          'categories',
          'paymentmethod',
          'stocks',
          'lab',
          'user',
        ],
      },
    ],
  },
  sources: [
    {
      type: String,
    },
  ],
  wallets: [
    {
      type: Object,
    },
  ],
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

UserSchema.pre('save', async function (next) {
  this.categories = [
    'Bank',
    'Car',
    'Food',
    'Fun',
    'Dining',
    'Gas',
    'Hydro',
    'Internet',
    'Phone',
    'Others',
    'Rent',
    'Transport',
    'Travel',
  ]
  this.sources = ['Cash', 'Debit', 'Credit']
  next()
})

// Add geolocation
// eslint-disable-next-line func-names
// UserSchema.pre('save', async function (next) {
//   const addressCity = `${this.address}, ${this.city}`
//   const isActive = process.env.GEOCODER_IS_ACTIVE
//   console.log('isActive: ', isActive)
//   //TODO: Change this but we still need to comment it out otherwise it gets triggered with an error
//   if(isActive) {
//      const loc = await geocoder.geocode(addressCity)
//     this.location = {
//       type: 'Point',
//       coordinates: [loc[0].longitude, loc[0].latitude],
//       formattedAddress: loc[0].formattedAddress,
//       street: loc[0].streetName,
//       city: loc[0].city,
//       state: loc[0].stateCode,
//       zipcode: loc[0].zipcode,
//       country: loc[0].countryCode,
//     }
//   } else {
//     console.log('remove location')
//     //this.location = {}
//   }
//   next()
// })

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

//TODO: Refactor with getResetPasswordToken
UserSchema.methods.setVerifyEmailToken = function () {
  // Generate the token
  const token = crypto.randomBytes(20).toString('hex')
  // Hash token and set to resetPasswordToken field
  this.verifyEmailToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')
  // Set expire
  this.verifyEmailExpire = Date.now() + 10 * 60 * 1000
  // Set isVerified to false
  this.isVerified = false
  return token
}

module.exports = mongoose.model('User', UserSchema)
