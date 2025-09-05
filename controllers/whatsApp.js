const asyncHandler = require('../middleware/async')
const axios = require('axios')
const matter = require('gray-matter')
const path = require('path')
const twilio = require('twilio')
const fs = require('fs/promises')

const VERIFY_TOKEN = 'HaloIA123012mmqasf012m43fmvvakj1~i1'

exports.sendVerification = (req, res) => {
  // WhatsApp envía esta request al verificar el webhook
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge) // confirma la verificación
  } else {
    res.sendStatus(403)
  }
}

exports.sendVerificationPost = asyncHandler((req, res) => {
  // WhatsApp envía esta request al verificar el webhook
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge) // confirma la verificación
  } else {
    res.sendStatus(403)
  }
})
