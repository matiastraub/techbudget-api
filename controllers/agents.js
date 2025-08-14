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
    return await generateOutgoingCall(req, res)
  } catch (error) {
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? error?.message ?? 'Internal Server Error'
        : 'Internal Server Error'
    return res.status(500).json({ error: errorMessage })
  }
})

async function generateOutgoingCall(req, res) {
  const { promptName } = req.params

  const mdPath = path.resolve(`./prompts/${promptName}.md`)

  const fileContent = await fs.readFile(mdPath, 'utf-8')
  const parsed = matter(fileContent)

  const prompt = parsed.content // Markdown body

  try {
    const { model, voice, temperature, phone } = req.body

    const {
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN,
      DESTINATION_PHONE_NUMBER,
      TWILIO_PHONE_NUMBER,
      ULTRAVOX_MODEL,
      ULTRAVOX_VOICE,
      ULTRAVOX_TEMPERATURE,
    } = process.env

    const callConfig = {
      //systemPrompt: prompt.default,
      systemPrompt: prompt,
      model: model || ULTRAVOX_MODEL,
      voice: voice || ULTRAVOX_VOICE,
      temperature: temperature || ULTRAVOX_TEMPERATURE,
      // firstSpeakerSettings: { user: {} }, // For outgoing calls, the user will answer the call (i.e. speak first)
      firstSpeakerSettings: { agent: {} },
      medium: { twilio: {} },
    }
    const ultravoxResponse = await createUltravoxCall(callConfig)

    if (!ultravoxResponse.joinUrl) {
      throw new Error('No joinUrl received from Ultravox API')
    }

    if (
      !TWILIO_ACCOUNT_SID ||
      !TWILIO_AUTH_TOKEN ||
      !DESTINATION_PHONE_NUMBER ||
      !TWILIO_PHONE_NUMBER
    ) {
      throw new Error('Missing required environment variables for Twilio')
    }

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    const call = await client.calls.create({
      twiml: `<Response><Connect><Stream url="${ultravoxResponse.joinUrl}"/></Connect></Response>`,
      to: phone,
      from: TWILIO_PHONE_NUMBER,
    })

    console.log('🎉 Twilio outbound phone call initiated successfully!')
    console.log(`📋 Twilio Call SID: ${call.sid}`)
    console.log(`📞 Calling ${phone} from ${TWILIO_PHONE_NUMBER}`)

    res.status(200).json({
      status: 'success',
      msg: '🎉 Twilio outbound phone call initiated successfully!',
      sid: call.sid,
      from: TWILIO_PHONE_NUMBER,
      to: phone,
    })
  } catch (error) {
    if (error instanceof Error) {
      console.error('Ultravox call error:', error.message)
      res.status(500).json({
        error: 'Failed to create Ultravox call',
        message: error.message,
      })
      console.error('💥 Error occurred:')

      if (error.message.includes('Authentication')) {
        console.error(
          '   🔐 Authentication failed - check your Twilio credentials'
        )
      } else if (error.message.includes('phone number')) {
        console.error(
          '   📞 Phone number issue - verify your phone numbers are correct'
        )
      } else if (error.message.includes('Ultravox')) {
        console.error(
          '   🤖 Ultravox API issue - check your API key and try again'
        )
      } else {
        console.error(`   ${error.message}`)
      }

      console.error('\n🔍 Troubleshooting tips:')
      console.error('   • Double-check all configuration values')
      console.error(
        '   • Ensure phone numbers are in E.164 format (+1234567890)'
      )
      console.error('   • Verify your Twilio account has sufficient balance')
      console.error('   • Check that your Ultravox API key is valid')
    } else {
      console.error('Ultravox call error:', error)
      res.status(500).json({
        error: 'Failed to create Ultravox call',
        message: 'An unknown error occurred',
      })
    }
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
