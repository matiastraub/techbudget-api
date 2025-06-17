const ErrorResponse = require('../utils/ErrorResponse')
const asyncHandler = require('../middleware/async')
const axios = require('axios')
const apiCrypto = require('../data/mock/crypto/apiCryptoMin.json')
const apiCryptoHistory = require('../data/mock/crypto/apiCryptoHistory.json')

//Crypto
exports.getCryptoResponse = async () => {
  const url = `${process.env.CRYPTO_RAPID_API_URL}/coins`
  const options = {
    method: 'GET',
    url,
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
  try {
  const resp = mockData ? apiCrypto : await axios.request(options)

  const serverCoins = mockData ? resp.data : resp?.data?.data?.coins
  return serverCoins
  } catch(e) {
    console.log('error',e)
  }
}

exports.getCrypto = asyncHandler(async (req, res) => {
  const serverCoins = await this.getCryptoResponse()
  res.status(200).json({ success: true, data: serverCoins })
})

exports.getCryptoHistory = asyncHandler(async (req, res) => {
  const defaultTime =
    req.params.time || process.env.CRYPTO_RAPID_TIME_PERIOD_HISTORY
  const url = `${process.env.CRYPTO_RAPID_API_URL}/coin/${process.env.CRYPTO_RAPID_DEFAULT_COIN_ID}/history`
  const options = {
    method: 'GET',
    url,
    params: {
      referenceCurrencyUuid:
        process.env.CRYPTO_RAPID_DEFAULT_REFERENCE_CURRENCY,
      limit: process.env.CRYPTO_RAPID_API_LIMIT,
      timePeriod: defaultTime,
    },
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': process.env.CRYPTO_RAPID_API_KEY,
      'X-RapidAPI-Host': process.env.CRYPTO_RAPID_API_HOST,
    },
  }

  const mockData = process.env.CRYPTO_RAPID_MOCK_API_DATA === 'true'
  const resp = mockData ? apiCryptoHistory : await axios.request(options)
  const serverCoins = mockData ? resp.data.history : resp?.data?.data?.history
  res.status(200).json({ success: true, data: serverCoins })
})

//Geolocation

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
