const express = require('express')
const router = express.Router()
const listsController = require('../../controllers/encuestas/lists')

// For example, if you have auth middleware:
const { protect } = require('../../middleware/auth')

// Routes

// Get all list
router.get('/', protect, listsController.getLists)

// Get lists by campaign
router.get('/campaigns/:id', protect, listsController.getListsByCampaignId)

// Get single list item by ID
router.get('/:id', protect, listsController.getList)

// Create new list
router.post('/', protect, listsController.createList)
// Upload list
router.post('/upload', protect, listsController.uploadListsFile)

// Process the list
router.post('/process', protect, listsController.processList)

// Update list by ID
router.put('/:id', protect, listsController.updateList)

// Delete list by ID
router.delete('/:id', protect, listsController.deleteList)

module.exports = router
