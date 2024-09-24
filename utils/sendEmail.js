const emailAuth = require('../config/configEnv')
const nodemailer = require('nodemailer')
const config = require('../config/config')
const fs = require('fs')
const axios = require('axios')

const { host, port, auth } = emailAuth
const transporter = nodemailer.createTransport({
  host,
  port,
  //secure: false,
  auth,
  //TODO: Enviroment not working on transport, figure it out
  // host: process.env.SMTP_HOST,
  // port: process.env.SMTP_PORT,
  // // secure: true,
  // auth: {
  //   user: process.env.SMTP_EMAIL,
  //   pass: process.env.SMTP_PASSWORD,
  // },
})

/**
 * Check the default email sender set on the config
 *
 * @param {String} defaultSender
 * @returns {Function | String}
 */
const emailSender = (defaultSender) => {
  if (defaultSender === 'gogogol') {
    return sendGGGEmail
  }
  //Test email
  return sendEmail
}

exports.sendVerifyEmailWithTokenEmail = async (
  req,
  res,
  next,
  user,
  token,
  defaultSender
) => {
  await sendEmailTransportMessage(
    req,
    res,
    next,
    user,
    token,
    'verificationEmail',
    'Welcome to TechBudget',
    {},
    emailSender(defaultSender)
  )
}

exports.sendForgotPasswordEmail = async (
  req,
  res,
  next,
  user,
  token,
  defaultSender
) => {
  await sendEmailTransportMessage(
    req,
    res,
    next,
    user,
    token,
    'forgotPasswordEmail',
    'Forgot Password',
    { resettoken: token, email: user.email },
    emailSender(defaultSender)
  )
  next()
}

exports.sendResendTokenEmail = async (
  req,
  res,
  next,
  user,
  token,
  defaultSender
) => {
  await sendEmailTransportMessage(
    req,
    res,
    next,
    user,
    token,
    'resendTokenEmail',
    'Verify Email',
    {},
    emailSender(defaultSender)
  )
}

/**
 * Send Email
 *
 * @param {Object} options
 * @param {*} next
 */
const sendEmail = async (options, next) => {
  // send mail with defined transport object
  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email, // list of receivers
    subject: options.subject,
    text: options.message,
    html: `${options.message}`,
  }
  try {
    await transporter.sendMail(message)
    next()
  } catch (error) {
    console.error('Server email failed: ', error)
    next(new ErrorResponse('Server email failed', 500))
  }
}

/**
 * Send GGG emails
 * @param {Object} options
 * @param {*} next
 */
const sendGGGEmail = async (options, next) => {
  const url = config.apiGogogol.sendEmail
  const postData = {
    username: process.env.GGG_USERNAME,
    pass: process.env.GGG_PASS,
    email: options.email,
    subject: options.subject,
    msg: options.message,
  }
  try {
    const resp = await axios.post(url, postData, {
      withCredentials: false,
    })

    if (resp.status === 200) {
      console.log('resp sendGGG Email: ', resp.data)
      next()
    }
  } catch (error) {
    next(new ErrorResponse('GGG Server email failed', 500))
  }
}

const sendEmailTransportMessage = async (
  req,
  res,
  next,
  user,
  token,
  template,
  subject,
  params = {},
  fn
) => {
  const basicUrl = getUrl()
  const paramUrl =
    '?' +
    (Object.keys(params).length
      ? objectToQueryString(params)
      : `token=${token}`)

  const url = `${basicUrl}/${paramUrl}`
  const message = getEmailTemplate(req, user, template, url)

  try {
    await fn({ email: user.email, subject, message }, next)
  } catch (error) {
    await user.save({ validateBeforeSave: false })
    next(new ErrorResponse('Email could not be sent', 500))
  }
}

const getUrl = () => {
  const isProd = process.env.NODE_ENV === 'production'
  if (isProd) return config.domain.production
  return config.domain.development
}

const objectToQueryString = (obj) => {
  const queryString = Object.keys(obj)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&')
  return queryString
}

/**
 * Get Email template
 */
const getEmailTemplate = (req, user, templateName, link) => {
  const basicUrl = `https://www.techbudget.io`
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
