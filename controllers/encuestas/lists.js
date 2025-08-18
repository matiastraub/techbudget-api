const ErrorResponse = require('../../utils/ErrorResponse')
const asyncHandler = require('../../middleware/async')
const pool = require('../../config/mysql')

// @desc    Get all lists
// @route   GET /api/lists
// @access  Private
exports.getLists = asyncHandler(async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.id, c.phone, c.address, c.other_info, 
             m.id AS municipality_id, m.name AS municipality_name
      FROM lists c
      JOIN municipalities m ON c.municipality_id = m.id
    `)

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    })
  } catch (err) {
    console.error('DB Error:', err)
    return next(new ErrorResponse('Error fetching lists', 500))
  }
})

// @desc    Get single contact
// @route   GET /api/lists/:id
// @access  Private
exports.getList = asyncHandler(async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT c.id, c.phone, c.address, c.other_info, 
             m.id AS municipality_id, m.name AS municipality_name
      FROM lists c
      JOIN municipalities m ON c.municipality_id = m.id
      WHERE c.id = ?
    `,
      [req.params.id]
    )

    if (rows.length === 0) {
      return next(
        new ErrorResponse(`List not found with id ${req.params.id}`, 404)
      )
    }

    res.status(200).json({
      success: true,
      data: rows[0],
    })
  } catch (err) {
    console.error('DB Error:', err)
    return next(new ErrorResponse('Error fetching contact', 500))
  }
})

// @desc    Upload a transaction file (Excel from the front-end)
// @route   POST /api/v1/transactions/upload
// @access  Private
exports.uploadListsFile = asyncHandler(async (req, res, next) => {
  const transactions = req.body

  // Check max size
  if (transactions.length > process.env.MAX_TRANSACTIONS_UPLOAD) {
    return next(
      new ErrorResponse(`Upload limit reached ${transactions.length}`, 400)
    )
  }

  let transArray = []
  transactions.forEach((row) => {
    row.phone = row?.telefono
    row.municipality = row?.comuna
    row.channel = row?.canal //call', 'sms', 'whatsapp', 'telegram'
    row.address = row?.adddress
    row.other_info = row?.other_info

    transArray.push(row)

    createListFromList(row, res, next)
  })
  return res.status(201).json({ success: true, data: transArray })
})

const createListFromList = async (contact, res, next) => {
  //HARDCODED FOR NOW
  const campaign_id = process.env.DEFAULT_CAMPAIGN_ID

  const { phone, municipality, address, other_info } = contact
  if (!phone || !municipality) {
    return next(new ErrorResponse('Phone and municipality are required', 400))
  }

  try {
    // Get municipality_id
    const [muni] = await pool.query(
      'SELECT id FROM municipalities WHERE name = ?',
      [municipality]
    )
    if (muni.length === 0) {
      return next(
        new ErrorResponse(`Municipality '${municipality}' not found`, 400)
      )
    }
    const municipality_id = muni[0].id

    // Insert contact
    const [result] = await pool.query(
      `
      INSERT INTO lists (phone, municipality_id,campaign_id, address, other_info)
      VALUES (?, ?, ?, ?, ?)
    `,
      [phone, municipality_id, campaign_id, address || null, other_info || null]
    )

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        phone,
        municipality_id,
        campaign_id,
        address,
        other_info,
      },
    })
  } catch (err) {
    console.error('DB Error:', err)
    return next(new ErrorResponse('Error creating contact', 500))
  }
}

// @desc    Create contact
// @route   POST /api/lists
// @access  Private
exports.createList = asyncHandler(async (req, res, next) => {
  const { phone, municipality, address, other_info } = req.body

  if (!phone || !municipality) {
    return next(new ErrorResponse('Phone and municipality are required', 400))
  }

  try {
    // Get municipality_id
    const [muni] = await pool.query(
      'SELECT id FROM municipalities WHERE name = ?',
      [municipality]
    )
    if (muni.length === 0) {
      return next(
        new ErrorResponse(`Municipality '${municipality}' not found`, 400)
      )
    }
    const municipality_id = muni[0].id

    // Insert contact
    const [result] = await pool.query(
      `
      INSERT INTO lists (phone, municipality_id, address, other_info)
      VALUES (?, ?, ?, ?)
    `,
      [phone, municipality_id, address || null, other_info || null]
    )

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        phone,
        municipality_id,
        address,
        other_info,
      },
    })
  } catch (err) {
    console.error('DB Error:', err)
    return next(new ErrorResponse('Error creating contact', 500))
  }
})

// @desc    Update contact
// @route   PUT /api/lists/:id
// @access  Private
exports.updateList = asyncHandler(async (req, res, next) => {
  const { phone, municipality, address, other_info } = req.body

  try {
    let municipality_id
    if (municipality) {
      const [muni] = await pool.query(
        'SELECT id FROM municipalities WHERE name = ?',
        [municipality]
      )
      if (muni.length === 0) {
        return next(
          new ErrorResponse(`Municipality '${municipality}' not found`, 400)
        )
      }
      municipality_id = muni[0].id
    }

    const [result] = await pool.query(
      `
      UPDATE lists 
      SET phone = COALESCE(?, phone),
          municipality_id = COALESCE(?, municipality_id),
          address = COALESCE(?, address),
          other_info = COALESCE(?, other_info)
      WHERE id = ?
    `,
      [
        phone || null,
        municipality_id || null,
        address || null,
        other_info || null,
        req.params.id,
      ]
    )

    if (result.affectedRows === 0) {
      return next(
        new ErrorResponse(`List not found with id ${req.params.id}`, 404)
      )
    }

    res.status(200).json({
      success: true,
      message: `List ${req.params.id} updated successfully`,
    })
  } catch (err) {
    console.error('DB Error:', err)
    return next(new ErrorResponse('Error updating contact', 500))
  }
})

// @desc    Delete contact
// @route   DELETE /api/lists/:id
// @access  Private
exports.deleteList = asyncHandler(async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM lists WHERE id = ?', [
      req.params.id,
    ])
    if (result.affectedRows === 0) {
      return next(
        new ErrorResponse(`List not found with id ${req.params.id}`, 404)
      )
    }

    res.status(200).json({
      success: true,
      message: `List ${req.params.id} deleted successfully`,
    })
  } catch (err) {
    console.error('DB Error:', err)
    return next(new ErrorResponse('Error deleting contact', 500))
  }
})

// @desc    Process list to communicate with the different channels
// @route   POST /api/lists/process
// @access  Private
exports.processList = asyncHandler(async (req, res, next) => {
  campaign_id = process.env.DEFAULT_CAMPAIGN_ID
  channel_id = process.env.DEFAULT_CHANNEL

  const listIdsToInsertQuery = `SELECT id FROM lists WHERE id NOT IN (SELECT list_id FROM list_attempts);`

  const [resultIds] = await pool.query(listIdsToInsertQuery, [campaign_id])
  const ids = resultIds.map((i) => i.id)
  if (ids.length > 0) {
    const values = ids.map((id) => [
      id,
      channel_id,
      new Date(),
      'pending',
      null,
    ])

    const insertQuery = `INSERT INTO list_attempts (list_id, channel_id, attempt_time, status, notes)
    VALUES ? ON DUPLICATE KEY UPDATE attempt_time = attempt_time`

    const [resultInsert] = await pool.query(insertQuery, [values])
    const { insertId } = resultInsert
    res.status(200).json({ success: true, data: insertId })
  } else {
    res.status(404).json({ success: false, msg: 'Not Found' })
  }
})
