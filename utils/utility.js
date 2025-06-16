const config = require('../config/config')

const objectToQueryString = (obj) => {
  const queryString = Object.keys(obj)
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&')
  return queryString
}

const getUrl = () => {
  const isProd = process.env.NODE_ENV === 'production'
  if (isProd) return config.domain.production
  return config.domain.development
}

module.exports = { objectToQueryString,getUrl }