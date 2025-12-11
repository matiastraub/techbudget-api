const ErrorResponse = require('../../utils/ErrorResponse')
const asyncHandler = require('../../middleware/async')
const pool = require('../../config/mysql')
const axios = require('axios')

// utility: mask API token before sending in response
function maskToken(token) {
  if (!token) return null
  if (token.length <= 8) return '****'
  return token.slice(0, 4) + '...' + token.slice(-4)
}

exports.getContactsByPhone = async (req, res, next) => {
  const phoneNumber = req.params.phoneNumber

  //TODO Move to a DB
  const accounts = [
    {
      name: 'halo',
      chatwootUrl: 'https://services.halo.cl',
      accountId: 1,
      apiToken: process.env['API-KEY-CHATWOOT-HALO'],
      inboxId: 3,
    },
    {
      name: 'auteria',
      chatwootUrl: 'https://services.halo.cl',
      accountId: 3,
      apiToken: process.env['API-KEY-CHATWOOT-AUTERIA'],
      inboxId: 2,
    },
    {
      name: 'ISU Auto',
      chatwootUrl: 'https://services.halo.cl',
      accountId: 4,
      apiToken: process.env['API-KEY-CHATWOOT-AUTERIA'],
      inboxId: 5,
    },
    {
      name: 'Vendo Autos',
      chatwootUrl: 'https://services.halo.cl',
      accountId: 5,
      apiToken: process.env['API-KEY-CHATWOOT-AUTERIA'],
      inboxId: 6,
    },
    {
      name: 'Agusavi',
      chatwootUrl: 'https://services.halo.cl',
      accountId: 6,
      apiToken: process.env['API-KEY-CHATWOOT-HALO'],
      inboxId: 7,
    },
  ]

  async function findAllContacts() {
    const allMatches = []

    for (const account of accounts) {
      try {
        const response = await axios.get(
          `${account.chatwootUrl}/api/v1/accounts/${account.accountId}/contacts/search`,
          {
            params: { q: phoneNumber },
            headers: { api_access_token: account.apiToken },
          }
        )

        const payload = response.data?.payload
        if (payload && payload.length > 0) {
          // pick last in this payload
          const last = payload[payload.length - 1]

          allMatches.push({ contact: last, account })
        }
      } catch (err) {
        console.error(`Error searching account ${account.name}:`, err.message)
      }
    }

    if (allMatches.length === 0) {
      return { contact: null, account: null }
    }

    // pick the one with the latest last_activity_at
    const best = allMatches.reduce((a, b) => {
      return (a.contact.last_activity_at || 0) >
        (b.contact.last_activity_at || 0)
        ? a
        : b
    })

    // determine correct account from contact inbox
    let matchedAccount = null
    const inboxes = best.contact.contact_inboxes || []

    for (const ci of inboxes) {
      const inboxId = ci?.inbox?.id
      if (!inboxId) continue

      matchedAccount = accounts.find((a) => a.inboxId === inboxId)
      if (matchedAccount) break
    }

    const finalAccount = matchedAccount || best.account

    return {
      contact: best.contact,
      account: {
        ...finalAccount,
        apiToken: finalAccount.apiToken, //maskToken(finalAccount.apiToken),
      },
    }
  }

  const result = await findAllContacts()

  res.status(200).json({
    success: true,
    data: {
      phoneNumber,
      foundContact: result.contact,
      targetAccount: result.account,
    },
  })
}

// @desc    Get all chatwoot contacts
// @route   GET /api/chatwoot-contacts/
// @access  Private
exports.getContacts = asyncHandler(async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM chatwoot_contacts')

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (err) {
    console.error('DB Error:', err)
    return next(new ErrorResponse('Error fetching contacts', 500))
  }
})

// @desc    Get single contact by ID
// @route   GET /api/chatwoot-contacts/:id
// @access  Private
exports.getContact = asyncHandler(async (req, res, next) => {
  const { id } = req.params
  const [rows] = await pool.query(
    'SELECT * FROM chatwoot_contacts WHERE id = ?',
    [id]
  )

  if (rows.length === 0) {
    return next(new ErrorResponse(`Contact not found with id ${id}`, 404))
  }

  res.status(200).json({
    success: true,
    data: rows[0],
  })
})

// @desc    Create new contact
// @route   POST /api/chatwoot-contacts/
// @access  Private
exports.createContact = asyncHandler(async (req, res, next) => {
  const {
    wamid,
    account_id,
    contact_id,
    phone,
    inbox_id,
    conversation_id,
    direction,
    message,
    status,
    created_at,
    source,
  } = req.body

  const sql = `
    INSERT INTO chatwoot_contacts
    (wamid, account_id, contact_id, phone, inbox_id, conversation_id, direction, message, status, created_at, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `

  const [result] = await pool.query(sql, [
    wamid,
    account_id,
    contact_id,
    phone,
    inbox_id,
    conversation_id,
    direction,
    message,
    status,
    created_at,
    source,
  ])

  const [rows] = await pool.query(
    'SELECT * FROM chatwoot_contacts WHERE id = ?',
    [result.insertId]
  )

  res.status(201).json({
    success: true,
    data: rows[0],
  })
})

// @desc    Update contact by ID
// @route   PUT /api/chatwoot-contacts/:id
// @access  Private
exports.updateContact = asyncHandler(async (req, res, next) => {
  const { id } = req.params

  // Check contact exists
  const [existing] = await pool.query(
    'SELECT * FROM chatwoot_contacts WHERE id = ?',
    [id]
  )
  if (existing.length === 0) {
    return next(new ErrorResponse(`Contact not found with id ${id}`, 404))
  }

  const {
    wamid,
    account_id,
    contact_id,
    phone,
    inbox_id,
    conversation_id,
    direction,
    message,
    status,
    created_at,
    source,
  } = req.body

  const sql = `
    UPDATE chatwoot_contacts
    SET wamid = ?, account_id = ?, contact_id = ?, phone = ?, inbox_id = ?, conversation_id = ?,
        direction = ?, message = ?, status = ?, created_at = ?, source = ?
    WHERE id = ?
  `

  await pool.query(sql, [
    wamid,
    account_id,
    contact_id,
    phone,
    inbox_id,
    conversation_id,
    direction,
    message,
    status,
    created_at,
    source,
    id,
  ])

  const [rows] = await pool.query(
    'SELECT * FROM chatwoot_contacts WHERE id = ?',
    [id]
  )

  res.status(200).json({
    success: true,
    data: rows[0],
  })
})

// @desc    Delete contact by ID
// @route   DELETE /api/chatwoot-contacts/:id
// @access  Private
exports.deleteContact = asyncHandler(async (req, res, next) => {
  const { id } = req.params

  const [existing] = await pool.query(
    'SELECT * FROM chatwoot_contacts WHERE id = ?',
    [id]
  )
  if (existing.length === 0) {
    return next(new ErrorResponse(`Contact not found with id ${id}`, 404))
  }

  await pool.query('DELETE FROM chatwoot_contacts WHERE id = ?', [id])

  res.status(200).json({
    success: true,
    data: {},
    message: `Contact with id ${id} deleted`,
  })
})
