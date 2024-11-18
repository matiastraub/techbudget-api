const ErrorResponse = require('../utils/ErrorResponse')
const asyncHandler = require('../middleware/async')
const axios = require('axios')

exports.getCrypto = asyncHandler(async (req, res) => {
  const options = {
    method: 'GET',
    url: process.env.CRYPTO_RAPID_API_URL,
    params: {
      limit: process.env.CRYPTO_RAPID_API_LIMIT,
      timePeriod: process.env.CRYPTO_RAPID_TIME_PERIOD,
    },
    headers: {
      'X-RapidAPI-Key': process.env.CRYPTO_RAPID_API_KEY,
      'X-RapidAPI-Host': process.env.CRYPTO_RAPID_API_HOST,
    },
  }
  const resp =
    process.env.CRYPTO_RAPID_MOCK_API_DATA === true
      ? apiCrypto
      : await axios.request(options)

  const serverCoins =
    process.env.CRYPTO_RAPID_MOCK_API_DATA === true
      ? resp.data.coins
      : resp?.data?.data?.coins
  res.status(200).json({ success: true, data: serverCoins })
})
