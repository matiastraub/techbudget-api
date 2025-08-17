const asyncHandler = require('../middleware/async')
const axios = require('axios')
const matter = require('gray-matter')
const path = require('path')
const twilio = require('twilio')
const fs = require('fs/promises')
const { generateFakeCall, fixData } = require('../utils/encuestas')

const START_FAKE_CALLS = false
let fakeCalls = []

if (START_FAKE_CALLS) {
  // Generate new call every 5 seconds
  setInterval(() => {
    fakeCalls.unshift(generateFakeCall())
    if (fakeCalls.length > 10000) fakeCalls.pop()
  }, 5000)
}

// @desc    Get call
// @route   GET /api/v1/categories/:user
// @access  Private
exports.getCallFake = asyncHandler((req, res) => {
  res.status(200).json({
    success: true,
    data: { isMock: true, data: fakeCalls, total: fakeCalls.length },
  })
})

exports.getCallFixData = asyncHandler((req, res) => {
  const resp = {
    success: true,
    data: {
      data: fixData,
      total: 12,
    },
  }
  res.status(200).json({
    success: true,
    data: { isMock: true, data: resp.data.data, total: resp.data.total },
  })
})

exports.getCall = asyncHandler(async (req, res) => {
  const url = process.env.ULTRAVOX_API_URL
  const apiKey = process.env.ULTRAVOX_X_API_KEY
  const options = {
    method: 'GET',
    url,
    params: {
      limit: process.env.API_LIMIT,
      timePeriod: process.env.API_TIME_PERIOD,
    },
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
  }
  const resp = await axios.request(options)
  const total = resp.data.total
  const data = resp.data.results.map(
    ({
      callId,
      created,
      ended,
      endReason,
      errorCount,
      joinTimeout,
      maxDuration,
      joined,
      shortSummary,
      summary,
    }) => ({
      callId,
      created,
      ended,
      endReason,
      errorCount,
      joinTimeout,
      maxDuration,
      joined,
      shortSummary,
      summary,
    })
  )
  res.status(200).json({ success: true, data: { data, total } })
})

// @desc    Create a call
// @route   POST /api/v1/agents/call
// @access  Private
exports.createCall = asyncHandler(async (req, res) => {
  try {
    const result = await generateOutgoingCall(req)
    return res.status(200).json(result)
  } catch (error) {
    next(error)
  }
})

async function generateOutgoingCall(req) {
  const { promptName } = req.params

  const mdPath = path.resolve(`./prompts/${promptName}.md`)

  const fileContent = await fs.readFile(mdPath, 'utf-8')
  const parsed = matter(fileContent)

  const prompt = parsed.content // Markdown body

  const { model, voice, temperature, phone, listAttemptId } = req.body
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
    ULTRAVOX_MODEL,
    ULTRAVOX_VOICE,
    ULTRAVOX_TEMPERATURE,
  } = process.env

  if (!phone || !listAttemptId) throw new Error('Missing required parameters')

  // 1️⃣ Create Ultravox call
  const callConfig = {
    systemPrompt: prompt,
    model: model || ULTRAVOX_MODEL,
    voice: voice || ULTRAVOX_VOICE,
    temperature: temperature || ULTRAVOX_TEMPERATURE,
    // firstSpeakerSettings: { user: {} }, // For outgoing calls, the user will answer the call (i.e. speak first)
    firstSpeakerSettings: { agent: {} },
    medium: { twilio: {} },
  }
  const ultravoxResponse = await createUltravoxCall(callConfig)
  console.log('ultravoxResponse: ', ultravoxResponse)

  const ultravoxCallId = ultravoxResponse?.callId
  const ultravoxCreated = ultravoxResponse?.created

  if (!ultravoxResponse.joinUrl) {
    throw new Error('No joinUrl received from Ultravox API')
  }

  // 2️⃣ Initiate Twilio call
  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

  const call = await client.calls.create({
    twiml: `<Response><Connect><Stream url="${ultravoxResponse.joinUrl}"/></Connect></Response>`,
    to: phone,
    from: TWILIO_PHONE_NUMBER,
  })

  console.log('🎉 Twilio outbound phone call initiated successfully!')
  console.log(`📋 Twilio Call SID: ${call.sid}`)
  console.log(`📞 Calling ${phone} from ${TWILIO_PHONE_NUMBER}`)

  return {
    status: 'success',
    msg: '🎉 Twilio outbound phone call initiated successfully!',
    sid: call.sid,
    from: TWILIO_PHONE_NUMBER,
    to: phone,
    listAttemptId,
    ultravoxCallId,
    ultravoxCreated,
  }
}

async function createUltravoxCall(callConfig) {
  const ULTRAVOX_API_URL = process.env.ULTRAVOX_API_URL
  const ULTRAVOX_X_API_KEY = process.env.ULTRAVOX_X_API_KEY

  if (!ULTRAVOX_API_URL) {
    throw new Error('ULTRAVOX_API_URL environment variable is required')
  }
  if (!ULTRAVOX_X_API_KEY) {
    throw new Error('ULTRAVOX_API_KEY environment variable is required')
  }

  try {
    const response = await axios.post(ULTRAVOX_API_URL, callConfig, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': ULTRAVOX_X_API_KEY,
      },
    })

    return response.data
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      throw new Error(
        `Ultravox API error (${error.response.status}): ${JSON.stringify(
          error.response.data
        )}`
      )
    } else if (error.request) {
      // Request was made but no response received
      throw new Error(`Network error calling Ultravox: ${error.message}`)
    } else {
      // Something else happened
      throw new Error(`Failed to create Ultravox call: ${error.message}`)
    }
  }
}
