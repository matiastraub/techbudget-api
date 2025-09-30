const express = require('express')
const {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  getContactsByPhone,
} = require('../../controllers/chatwoot/chatwootContacts')
const { apiAuth } = require('../../middleware/auth')

const router = express.Router()

router.route('/contactsByPhone/:phoneNumber').get(apiAuth, getContactsByPhone)

// GET all contacts
// GET single contact by id
// POST create contact
// PUT update contact
// DELETE remove contact
router.route('/').get(apiAuth, getContacts).post(apiAuth, createContact)
router
  .route('/:id')
  .get(apiAuth, getContact)
  .put(apiAuth, updateContact)
  .delete(apiAuth, deleteContact)

module.exports = router
