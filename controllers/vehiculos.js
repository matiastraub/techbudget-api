const ErrorResponse = require('../utils/ErrorResponse')
const asyncHandler = require('../middleware/async')

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
    const sellerId = req?.body?.sellerId || req?.body?.seller_id
    if (process.env['CHILEAUTOS-SELLER-ID'] === sellerId) {
      data = {
        success: true,
        data: {
          sellerId,
          method: 'body',
          sender: 'Chile Autos',
        },
      }
      return res.status(200).json(data)
    }
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  } catch (e) {
    return res.status(400).json({ success: false, error: e.message })
  }
}
