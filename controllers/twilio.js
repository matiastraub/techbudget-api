const asyncHandler = require('../middleware/async')
const axios = require('axios')
const matter = require('gray-matter')
const path = require('path')
const twilio = require('twilio')
const fs = require('fs/promises')

exports.forwardCall = asyncHandler(async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse()
  twiml.dial('+56956343596') // Destination number
  res.type('text/xml')
  res.send(twiml.toString())
})
