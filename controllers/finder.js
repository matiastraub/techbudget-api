const scrapeVehicleData = require('./finder/plate')
const asyncHandler = require('../middleware/async')

exports.getPlateInfo = asyncHandler(async (req, res) => {
  const plate = req.params.plate
  const data = await scrapeVehicleData(plate)
  res.status(200).json(data)
})
