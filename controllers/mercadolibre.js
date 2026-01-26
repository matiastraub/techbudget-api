const axios = require('axios')
const crypto = require('crypto')
const pool = require('../config/mysql')

/**
 * =========================
 * HELPERS
 * =========================
 */

// Generar PKCE
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('hex')
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url') // importante: base64url
}

// Buscar cliente por meli_user_id
async function getCustomerByMeliUserId(meliUserId) {
  try {
    const query = `SELECT * FROM meli_integrations WHERE meli_user_id = ? LIMIT 1`
    const [rows] = await pool.query(query, [meliUserId])
    return rows[0] || null
  } catch (error) {
    console.error('getCustomerByMeliUserId error:', error.message)
    return null
  }
}

// Guardar tokens en la DB (y code_verifier temporal)
async function saveMercadoLibreTokens({
  customerId,
  userId,
  accessToken,
  refreshToken,
  expiresIn,
  codeVerifier = null,
}) {
  try {
    const tokenExpiry = Date.now() + expiresIn * 1000 - 60000 // -1 min por seguridad
    const query = `
      INSERT INTO meli_integrations
        (dealer_id, meli_user_id, meli_access_token, meli_refresh_token, token_expires_at, code_verifier)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        meli_access_token = VALUES(meli_access_token),
        meli_refresh_token = VALUES(meli_refresh_token),
        token_expires_at = VALUES(token_expires_at),
        code_verifier = VALUES(code_verifier)
    `
    await pool.query(query, [
      customerId,
      userId,
      accessToken,
      refreshToken,
      tokenExpiry,
      codeVerifier,
    ])
  } catch (error) {
    console.error('saveMercadoLibreTokens error:', error.message)
  }
}

// Obtener access token válido (refresh si es necesario)
async function getValidAccessToken(integration) {
  if (!integration) return null

  const now = Date.now()
  if (now < integration.token_expires_at) return integration.meli_access_token

  try {
    const response = await axios.post(
      'https://api.mercadolibre.com/oauth/token',
      {
        grant_type: 'refresh_token',
        client_id: process.env.ML_CLIENT_ID,
        client_secret: process.env.ML_CLIENT_SECRET,
        refresh_token: integration.meli_refresh_token,
      },
      { headers: { 'Content-Type': 'application/json' } }
    )

    const { access_token, refresh_token, expires_in } = response.data
    const newExpiry = Date.now() + expires_in * 1000 - 60000

    const query = `
      UPDATE meli_integrations
      SET meli_access_token = ?, meli_refresh_token = ?, token_expires_at = ?
      WHERE dealer_id = ?
    `
    await pool.query(query, [
      access_token,
      refresh_token,
      newExpiry,
      integration.dealer_id,
    ])

    return access_token
  } catch (error) {
    console.error('Error refreshing MeLi access token:', error.message)
    return null
  }
}

// Enviar payload a N8N
async function enqueueToN8N(payload) {
  if (!payload) return false
  try {
    await axios.post(process.env.N8N_ML_WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 2000,
    })
    return true
  } catch (error) {
    console.error('Failed to enqueue to N8N:', error.message)
    return false
  }
}

/**
 * =========================
 * CONTROLLERS
 * =========================
 */

// Paso 1: Redirigir al usuario a OAuth de Mercado Libre (con PKCE)
exports.connectMercadoLibre = async (req, res) => {
  const clientId = process.env.ML_CLIENT_ID
  const redirectUri = process.env.ML_REDIRECT_URI
  const customerId = req.query.customerId

  // Generar PKCE
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = generateCodeChallenge(codeVerifier)

  // Guardar code_verifier temporal en DB
  await saveMercadoLibreTokens({
    customerId,
    codeVerifier,
    userId: 0,
    accessToken: '',
    refreshToken: '',
    expiresIn: 3600,
  })

  const url = `${process.env.ML_AUTH_URL}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&state=${encodeURIComponent(customerId)}&code_challenge=${codeChallenge}&code_challenge_method=S256`

  res.redirect(url)
}

// Paso 2: Callback OAuth de Mercado Libre
exports.mercadoLibreCallback = async (req, res) => {
  const { code, state: customerId } = req.query

  try {
    // Leer code_verifier desde DB
    const integration = await getCustomerByMeliUserId(0) //Se busca el user_id=0 (creado al conectar) temporalmente buscamos por dealer_id=customerId
    const codeVerifier = integration?.code_verifier
    if (!codeVerifier)
      throw new Error('Missing code_verifier for dealer ' + customerId)

    const response = await axios.post(
      'https://api.mercadolibre.com/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.ML_CLIENT_ID,
        client_secret: process.env.ML_CLIENT_SECRET,
        code,
        redirect_uri: process.env.ML_REDIRECT_URI,
        code_verifier: codeVerifier,
      })
    )

    const { access_token, refresh_token, user_id, expires_in } = response.data

    await saveMercadoLibreTokens({
      customerId,
      userId: user_id,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      codeVerifier: null, // limpiar
    })

    res.redirect(
      `https://www.halo.cl/es/integrations?status=success&dealer=${customerId}`
    )
  } catch (error) {
    console.error(error.response?.data || error)
    res.redirect(
      `https://www.halo.cl/es/integrations?status=error&dealer=${customerId}`
    )
  }
}

exports.getConnectToN8N = async (req, res) => {
  res.sendStatus(200)
}

exports.postConnectToN8N = async (req, res) => {
  const payload = {
    source: 'mercadolibre',
    payload: req.body,
  }
  await enqueueToN8N(payload)
  res.sendStatus(200)
}

exports.getMercadoLibreWebhook = async (req, res) => {
  // Mercado Libre envía una validación GET
  console.log('req: ', req)
  res.sendStatus(200)
}

// Paso 3: Webhook para recibir mensajes y otros eventos
exports.mercadoLibreWebhook = async (req, res) => {
  try {
    res.sendStatus(200)

    const { topic, resource, user_id, application_id } = req.body
    if (!topic || !resource || !user_id) return
    if (application_id !== process.env.ML_CLIENT_ID) return

    const integration = await getCustomerByMeliUserId(user_id)
    if (!integration) return

    const accessToken = await getValidAccessToken(integration)
    if (!accessToken) return

    if (topic === 'messages') {
      const messageResp = await axios.get(
        `https://api.mercadolibre.com${resource}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )

      await enqueueToN8N({
        source: 'mercadolibre',
        dealer_id: integration.dealer_id,
        seller_id: user_id,
        topic,
        payload: messageResp.data,
      })
    }
  } catch (error) {
    console.error('MeLi webhook error:', error.message)
  }
}
