const crypto = require('crypto')
const ErrorResponse = require('../utils/ErrorResponse')
const asyncHandler = require('../middleware/async')
const sendEmail = require('../utils/sendEmail')
const User = require('../models/User')
const config = require('../config/config')
const fs = require('fs')

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

  const user = await User.create({
    name,
    email,
    password,
    verifyEmailToken,
    verifyEmailExpire: Date.now() + 10 * 60 * 1000,
    //city,
    //address
  })

  await sendVerifyEmailWithToken(req, res, next, user, token)
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
  await sendResendTokenEmail(req, res, next, user, token)
  res.status(200).json({
    success: true,
    data: user,
  })
})

//TODO: Move to another file
const getEmailMessage = (req, user, templateName, link) => {
  const basicUrl = `${req.protocol}://${req.get('host')}`
  //TODO: Move to configs
  const logoUrl = `${basicUrl}/public/uploads/logo.png`
  let message = fs.readFileSync(
    `${__dirname}/../templates/${templateName}.html`,
    'utf-8'
  )
  return message
    .replace('{link}', link)
    .replace('{name}', user.name)
    .replace('{logo}', logoUrl)
}

const getUrl = () => {
  const isProd = process.env.NODE_ENV === 'production'
  if (isProd) return config.domain.production
  return config.domain.development
}

const sendEmailMessage = async (
  req,
  res,
  next,
  user,
  token,
  template,
  subject
) => {
  const basicUrl = getUrl()
  const url = `${basicUrl}/?token=${token}`
  const message = getEmailMessage(req, user, template, url)
  try {
    await sendEmail({
      email: user.email,
      subject,
      message,
    })
    return true
  } catch (error) {
    console.log('error: ', error)
    await user.save({ validateBeforeSave: false })
    return next(new ErrorResponse('Email could not be sent', 500))
  }
}

const sendVerifyEmailWithToken = async (req, res, next, user, token) => {
  return await sendEmailMessage(
    req,
    res,
    next,
    user,
    token,
    'verificationEmail',
    'Welcome to TechBudget'
  )
}

const sendResendTokenEmail = async (req, res, next, user, token) => {
  return await sendEmailMessage(
    req,
    res,
    next,
    user,
    token,
    'resendTokenEmail',
    'Verify Email'
  )
}

/*
    @desc Reset Password
    @route PUT /api/v1/auth/verifyEmail/:token
    @access Public
*/
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const token = req.body.token
  const verifyEmailToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')
  const user = await User.findOne({
    verifyEmailToken,
    verifyEmailExpire: { $gt: Date.now() },
  })
  if (!user) {
    return next(new ErrorResponse('Invalid token', 400))
  }

  user.verifyEmailToken = undefined
  user.verifyEmailExpire = undefined
  user.isVerified = true
  await user.save({ validateBeforeSave: false })
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
    const err2 = new ErrorResponse('Invalid credentials', 401)
    return next(err2)
  }

  const isMatch = await user.matchPassword(password)
  if (!isMatch) {
    const err3 = new ErrorResponse('Invalid credentials', 401)
    return next(err3)
  }

  // Create token
  return sendTokenResponse(user, 200, res)
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
    const err2 = new ErrorResponse('User not found', 404)
    next(err2)
  }

  const resetToken = await user.getResetPasswordToken()
  await user.save({ validateBeforeSave: false })

  const basicUrl = `${req.protocol}://${req.get('host')}`
  const resetUrl = `${basicUrl}/auth/resetPassword/${resetToken}`
  const logoUrl = `${basicUrl}/public/uploads/logo.png`

  // TODO: REFACTOR Export message
  //const message = `You are receiving this email because you (or someone else) requested to reset the password. PLease make a PUT Request to :\n\n ${resetUrl}`
  let message = fs.readFileSync(
    `${__dirname}/../templates/verificationEmail.html`,
    'utf-8'
  )
  //console.log('message: ', message);
  message = message
    .replace('{link}', resetUrl)
    .replace('{name}', user.name)
    .replace('{logo}', logoUrl)
  //
  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message,
    })
    return res
      .status(200)
      .json({ success: true, data: 'Email sent', token: resetToken })
  } catch (error) {
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save({ validateBeforeSave: false })
    return next(new ErrorResponse('Email could not be sent', 500))
  }
})

/*
    @desc Reset Password
    @route PUT /api/v1/auth/resetPassword/:resettoken
    @access Public
*/
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const token = req.params.resettoken
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  })

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400))
  }
  // set new password
  user.password = req.body.password
  user.resetPasswordToken = undefined
  user.resetPasswordExpire = undefined
  await user.save({ validateBeforeSave: false })
  return sendTokenResponse(user, 200, res)
})
