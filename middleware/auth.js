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

// Protect routes through API key
exports.apiAuthChileAutos = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers['authorization'] || ''
  const apiKey = req.headers['x-api-key']

  // Check API key first (machine-to-machine)
  if (apiKey && apiKey === process.env['X-API-KEY-CHILEAUTOS']) {
    return next()
  }

  // Otherwise check JWT token (browser calls)
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (token) {
    // verify JWT...
    return next()
  }

  return next(new ErrorResponse('Not authorized to access this route', 401))
})

// Protect routes through API key
exports.apiAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers['authorization'] || ''
  const apiKey = req.headers['x-api-key']

  // Check API key first (machine-to-machine)
  if (apiKey && apiKey === process.env['X-API-KEY-ENCUESTA']) {
    return next()
  }

  // Otherwise check JWT token (browser calls)
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (token) {
    // verify JWT...
    return next()
  }

  return next(new ErrorResponse('Not authorized to access this route', 401))
})

// Combined middleware with protected user and API key
exports.combinedAuth = asyncHandler(async (req, res, next) => {
  // Try user JWT first
  protect(req, res, (err) => {
    if (!err) return next() // User authenticated

    // If user JWT fails, try API key
    apiAuth(req, res, (err2) => {
      if (!err2) return next() // API key authenticated

      // Neither worked → Unauthorized
      res.status(401).json({ message: 'Unauthorized' })
    })
  })
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
