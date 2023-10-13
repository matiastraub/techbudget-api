const jwt = require('jsonwebtoken')
const asyncHandler = require('./async')
const ErrorResponse = require('../utils/ErrorResponse')
const User = require('../models/User')

// Protect routes

exports.protect = asyncHandler(async (req, res, next) => {
  const { token } = req.cookies
  if (!token) {
    next(new ErrorResponse('Not authorized to access this route', 401))
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id)
    next()
  } catch (err) {
    next(err)
  }
})

exports.authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      )
    }
    next()
  }
