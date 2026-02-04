const ErrorResponse = require('../utils/ErrorResponse')
const asyncHandler = require('../middleware/async')
const axios = require('axios')

// @desc    Get testCall
// @route   GET /api/vehiculos/chileautos
// @access  Private
exports.test = asyncHandler(async (req, res) => {
  const dealer = req?.params?.dealer
  res.status(200).json({ success: true, msg: `${dealer} funcionando` })
})

// @desc    Post Chile autos Test
// @route   POST /api/vehiculos/chileautos
// @access  Private
exports.webhook = async (req, res) => {
  try {
    let data = {}
    if (req?.body) {
      data = {
        success: true,
        data: {
          method: 'post',
          sender: 'Chile Autos',
          body: req.body,
        },
      }
      enqueueToN8N(req.body)
      return res.status(200).json(data)
    }
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  } catch (e) {
    return res.status(400).json({ success: false, error: e.message })
  }
}

// Enviar payload a N8N
async function enqueueToN8N(payload) {
  if (!payload) return false
  try {
    await axios.post(process.env.CHILEAUTOS_WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 2000,
    })
    return true
  } catch (error) {
    console.error('Failed to enqueue to N8N:', error.message)
    return false
  }
}
