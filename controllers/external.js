const ErrorResponse = require('../utils/ErrorResponse')
const asyncHandler = require('../middleware/async')
const axios = require('axios')
const apiCrypto = require('../data/mock/apiCrypto.json')

exports.getCrypto = asyncHandler(async (req, res) => {
  const options = {
    method: 'GET',
    url: process.env.CRYPTO_RAPID_API_URL,
    params: {
      limit: process.env.CRYPTO_RAPID_API_LIMIT,
      timePeriod: process.env.CRYPTO_RAPID_TIME_PERIOD,
    },
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': process.env.CRYPTO_RAPID_API_KEY,
      'X-RapidAPI-Host': process.env.CRYPTO_RAPID_API_HOST,
    },
  }

  const mockData = process.env.CRYPTO_RAPID_MOCK_API_DATA === 'true'
  const resp = mockData ? apiCrypto : await axios.request(options)
  const serverCoins = mockData ? resp.data : resp?.data?.data?.coins
  res.status(200).json({ success: true, data: serverCoins })
})

exports.getGeolocationWithKey = asyncHandler(async (req, res) => {
  const { key, address } = req.params
  if (key === process.env.GEOLOCATION_KEY) {
    const resp = await axios.get(
      `${process.env.GOOGLE_URL}?${field}=${address}&key=${process.env.GOOGLE_API_KEY}`
    )
  } else {
    neex(new ErrorResponse(`Invalid Key`, 400))
  }
})

exports.getGeolocation = asyncHandler(async (req, res) => {
  const field = 'address' //also field: 'latlng' => (latitude,longitude)
  if (req.params[field] == '') {
    next(new ErrorResponse(`Address cannot be empty ${req.params[field]}`, 404))
  }

  const resp = await axios.get(
    `${process.env.GOOGLE_URL}?${field}=${req.params[field]}&key=${process.env.GOOGLE_API_KEY}`
  )

  if (resp.status !== 200) {
    next(new ErrorResponse(`Service unavailable`, 503))
  }
  res.status(200).json({ success: true, data: resp.data.results?.[0] })
})
