const ErrorResponse = require('../utils/ErrorResponse')
const asyncHandler = require('../middleware/async')

// @desc    Get testCall
// @route   GET /api/vehiculos/chileautos
// @access  Private
exports.test = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, msg: 'JMD funcionando' })
})

// @desc    Post Chile autos Test
// @route   POST /api/vehiculos/chileautos
// @access  Private
exports.webhook = async (req, res) => {
  try {
    let data = {}

    if (process.env['CHILEAUTOS-SELLER-ID'] === req?.body?.sellerId) {
      data = {
        success: true,
        data: {
          sellerId: req.body.sellerId,
          method: 'body',
          sender: 'Chile Autos',
        },
      }
      return res.status(200).json(data)
    }
    if (process.env['CHILEAUTOS-SELLER-ID'] === req?.params?.sellerId) {
      data = {
        success: true,
        data: {
          sellerId: req.params.sellerId,
          method: 'params',
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
