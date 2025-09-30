const ErrorResponse = require('../../utils/ErrorResponse')
const asyncHandler = require('../../middleware/async')
const pool = require('../../config/mysql')
const axios = require('axios')

exports.getContactsByPhone = async (req, res, next) => {
  const phoneNumber = req.params.phoneNumber
  console.log('Searching for phone number:', phoneNumber)
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
  ]

  async function findContact() {
    for (const account of accounts) {
      try {
        const response = await axios.get(
          `${account.chatwootUrl}/api/v1/accounts/${account.accountId}/contacts/search`,
          {
            params: { q: phoneNumber },
            headers: {
              api_access_token: account.apiToken,
            },
          }
        )

        if (response.data && response.data.payload.length > 0) {
          return { contact: response.data.payload[0], account }
        }
      } catch (err) {
        console.error(`Error searching account ${account.name}:`, err.message)
      }
    }
    return { contact: null, account: null }
  }

  const result = await findContact()

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
