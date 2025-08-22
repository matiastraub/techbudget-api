const asyncHandler = require('../middleware/async')
const { getUrl } = require('../utils/utility')
const { getCryptoResponse } = require('../controllers/external')
const { addClient, removeClient } = require('../store/clients')
const config = require('../config/config')

const url = getUrl()

const headOptions = {
  'Content-Type': 'text/event-stream; charset="utf-8"',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
}

exports.sseHandler = (req, res) => {
  res.writeHead(200, headOptions)
  res.flushHeaders()
  addClient(req, res)
  req.on('close', () => {
    removeClient(req)
  })
}

exports.getCryptoPrices = asyncHandler(async (req, res, next) => {
  try {
    const data = await getCryptoResponse()

    res.writeHead(200, headOptions)
    res.flushHeaders()

    const intervalId = setInterval(() => {
      res.write(`data: ${JSON.stringify(data)}\n\n`)
    }, config.events.cryptoRefresh)

    res.on('close', () => {
      console.log('Client closed connection')
      clearInterval(intervalId)
      res.end()
    })
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' })
  }
})
