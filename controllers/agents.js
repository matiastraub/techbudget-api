const asyncHandler = require('../middleware/async')
const axios = require('axios')
const matter = require('gray-matter')
const path = require('path')
const twilio = require('twilio')
const fs = require('fs/promises')
const pool = require('../config/mysql')

const { generateFakeCall } = require('../utils/encuestas')

exports.getUltravoxFakeCallsRequest = async () => {
  const sql = `SELECT * FROM fake_ultravox`
  const [rows] = await pool.query(sql)
  return { data: rows, total: rows.length }
}

exports.getUltravoxFakeCalls = asyncHandler(async (req, res, next) => {
  const { data } = await this.getUltravoxFakeCallsRequest()
  res.status(200).json({
    success: true,
    data: { data },
  })
})

const createUltravoxFakeCall = asyncHandler(async (fakeCall) => {
  const {
    callId,
    created,
    joined,
    ended,
    joinTimeout,
    maxDuration,
    endReason,
    errorCount,
    shortSummary,
    summary,
  } = fakeCall

  const sql = `INSERT INTO fake_ultravox 
  (callId, created, joined, ended, joinTimeout, maxDuration, endReason, errorCount, shortSummary, summary)
  VALUES (?,?,?,?,?,?,?,?,?,?)`

  const [result] = await pool.query(sql, [
    callId,
    created,
    joined,
    ended,
    joinTimeout,
    maxDuration,
    endReason,
    errorCount,
    shortSummary,
    summary,
  ])
})

exports.getCallRequest = async () => {
  try {
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
    const data = resp.data.results
    const total = resp.data.total
    return { data, total }
  } catch (error) {
    return error
  }
}

// @desc    Get call
// @route   GET /api/v1/agents
// @access  Private
exports.getCallUltravox = asyncHandler(async (req, res) => {
  const USE_FAKE_CALLS = process.env.USE_FAKE_CALLS === 'true'
  if (USE_FAKE_CALLS) return await exports.getUltravoxFakeCalls(req, res)
  return await exports.getCall(req, res)
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
    return res.status(201).json({ success: true, data: result })
  } catch (error) {
    //next(error)
    res.status(401).json({ success: false, msg: error })
  }
})

async function generateOutgoingCall(req) {
  const USE_FAKE_CALLS = process.env.USE_FAKE_CALLS === 'true'
  const { promptName } = req.params
  const mdPath = path.resolve(`./prompts/${promptName}.md`)
  const fileContent = await fs.readFile(mdPath, 'utf-8')
  const parsed = matter(fileContent)
  const prompt = parsed.content
  const { model, voice, temperature, phone, listAttemptId, timeLimit } =
    req.body
  if (!phone || !listAttemptId) throw new Error('Missing required parameters')

  // 🟢 If testing mode, just return fake call data
  if (USE_FAKE_CALLS) {
    const fakeCall = generateFakeCall()
    await createUltravoxFakeCall(fakeCall)
    return {
      status: 'fake',
      msg: '🧪 Fake call generated (testing mode)',
      //  ...fakeCall,
      sid: 'FAKE_SID_' + Math.random().toString(36).substring(2, 15),
      from: 'FAKE_NUMBER',
      to: phone,

      listAttemptId,
      ultravoxCallId: fakeCall?.callId,
      ultravoxCreated: fakeCall?.created,
    }
  }
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } =
    process.env

  const ultravoxResponse = await createUltravoxCall(
    model,
    voice,
    temperature,
    prompt
  )

  if (!ultravoxResponse.joinUrl)
    throw new Error('No joinUrl received from Ultravox API')

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  const call = await client.calls.create({
    twiml: `<Response><Connect><Stream url="${ultravoxResponse.joinUrl}"/></Connect></Response>`,
    to: phone,
    from: TWILIO_PHONE_NUMBER,
    timeLimit: timeLimit || 120,
  })

  return {
    status: 'success',
    msg: '🎉 Twilio outbound phone call initiated successfully!',
    sid: call.sid,
    from: TWILIO_PHONE_NUMBER,
    to: phone,
    listAttemptId,
    ultravoxCallId: ultravoxResponse?.callId,
    ultravoxCreated: ultravoxResponse?.created,
  }
}

async function createUltravoxCall(model, voice, temperature, prompt) {
  const { ULTRAVOX_MODEL, ULTRAVOX_VOICE, ULTRAVOX_TEMPERATURE } = process.env

  const callConfig = {
    systemPrompt: prompt,
    model: model || ULTRAVOX_MODEL,
    voice: voice || ULTRAVOX_VOICE,
    temperature: temperature || ULTRAVOX_TEMPERATURE,
    // firstSpeakerSettings: { user: {} }, // For outgoing calls, the user will answer the call (i.e. speak first)
    firstSpeakerSettings: { agent: {} },
    medium: { twilio: {} },
  }

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
