const crypto = require('crypto')
const ErrorResponse = require('../utils/ErrorResponse')
const asyncHandler = require('../middleware/async')
const {
  sendVerifyEmailWithTokenEmail,
  sendForgotPasswordEmail,
  sendResendTokenEmail,
} = require('../utils/sendEmail')
const User = require('../models/User')
const config = require('../config/config')
const { sendEvent } = require('../store/clients')

/*
    @desc Send token response
    @route POST /api/v1/auth/sendTokenResponse
    @access Public
*/
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken()
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * config.cookiesExpire
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  }
  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, token })
}

/*
    @desc Register user
    @route POST /api/v1/auth/register
    @access Public
*/
exports.register = asyncHandler(async (req, res, next) => {
  const { email, password, name } = req.body
  const token = crypto.randomBytes(20).toString('hex')
  const verifyEmailToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')

  // Check user
  const checkUser = await User.findOne({ email }).select('+email')

  if (checkUser) {
    return next(new ErrorResponse('User already exists', 401))
  }

  const user = await User.create({
    name,
    email,
    password,
    verifyEmailToken,
    verifyEmailExpire: Date.now() + 10 * 60 * 1000,
    //city,
    //address
  })
  if (process.env.NODE_ENV === 'production') {
    await sendVerifyEmailWithTokenEmail(
      req,
      res,
      next,
      user,
      token,
      config.emailSender
    )
  }
  return sendTokenResponse(user, 200, res)
})

/*
    @desc Resend token to user
    @route POST /api/v1/auth/resendToken
    @access Private
*/
exports.resendToken = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse('User not found', 404))
  }
  const user = await User.findOne({ email: req.user.email })
  const token = user.setVerifyEmailToken()
  await user.save({ validateBeforeSave: false })
  await sendResendTokenEmail(req, res, next, user, token, config.emailSender)
  res.status(200).json({
    success: true,
    //TODO: change to data: user
    data: { user, token },
  })
})

/*
    @desc Reset Password
    @route PUT /api/v1/auth/verifyEmail
    @access Public
*/
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.body
  const verifyEmailToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')
  const user = await User.findOne({
    verifyEmailToken,
    verifyEmailExpire: { $gt: Date.now() },
  })
  if (!user) {
    return next(new ErrorResponse('Invalid Token', 400))
  }

  user.verifyEmailToken = undefined
  user.verifyEmailExpire = undefined
  user.isVerified = true
  await user.save({ validateBeforeSave: false })
  //Trigger server-sent event
  sendEvent(user?._id.toString(), { message: 'emailVerified' })
  return res.status(200).json({
    success: true,
    data: user,
  })
})

/*
    @desc Login user
    @route POST /api/v1/auth/login
    @access Public
*/
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body

  if (!email || !password) {
    const err1 = new ErrorResponse('please provide an email or password', 400)
    return next(err1)
  }

  // Check user
  const user = await User.findOne({ email }).select('+password')
  if (!user) {
    const err2 = new ErrorResponse('Invalid Credentials', 401)
    return next(err2)
  }

  const isMatch = await user.matchPassword(password)
  if (!isMatch) {
    const err3 = new ErrorResponse('Invalid Credentials', 401)
    return next(err3)
  }

  // Create token
  return sendTokenResponse(user, 200, res)
})

/*
    @desc Reset Password
    @route PUT /api/v1/auth/resetPassword
    @access Public
*/
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { token, password } = req.body
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select('+password')

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400))
  }
  // set new password
  user.password = password
  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined
  await user.save({ validateBeforeSave: false })
  res.status(200).json({
    success: true,
    data: user,
  })
})

/*
    @desc Get actual logged user
    @route POST /api/v1/auth/getMe
    @access Private
*/
exports.getMe = asyncHandler(async (req, res) => {
  if (req.user) {
    res.status(200).json({
      success: true,
      data: req.user,
    })
  }
})

/*
    @desc Log out user
    @route POST /api/v1/auth/logout
    @access Pribvate
*/
exports.logout = asyncHandler(async (req, res) => {
  const { token } = req.cookies
  if (token) {
    res.cookie('token', '', {
      expires: new Date(Date.now() + config.tokenExpires),
      httpOnly: true,
    })
    res.status(200).json({ success: true, msg: 'Logged out successfully' })
  }
})

/*
    @desc Forgot password
    @route POST /api/v1/auth/forgotPassword
    @access Public
*/
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body
  const user = await User.findOne({ email })

  if (!user) {
    const err = new ErrorResponse('User not found', 404)
    next(err)
  }

  const resetToken = await user.getResetPasswordToken()
  await user.save({ validateBeforeSave: false })
  try {
    await sendForgotPasswordEmail(
      req,
      res,
      next,
      user,
      resetToken,
      config.emailSender
    )
    res
      .status(200)
      .json({ success: true, data: 'Email sent', token: resetToken })
  } catch (error) {
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save({ validateBeforeSave: false })
    next(new ErrorResponse('Email could not be sent', 500))
  }
})
