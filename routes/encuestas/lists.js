const express = require('express')
const router = express.Router()
const listsController = require('../../controllers/encuestas/lists')

// For example, if you have auth middleware:
const { protect, apiAuth } = require('../../middleware/auth')

// Routes

// Get all list
router.get('/', protect, listsController.getLists)

// Get all list attempts
router.get('/attempts', protect, listsController.getListAttempts)

// Get all list attempts api
router.get('/attempts/api', apiAuth, listsController.getListAttempts)

// Get single list item by ID
router.get('/:id', protect, listsController.getList)

// Create new list
router.post('/', protect, listsController.createList)
// Upload list
router.post('/upload', listsController.uploadListsFile)

// Process the list
router.post('/process', listsController.processList)

// Update list by ID
router.put('/:id', protect, listsController.updateList)

// Delete list by ID
router.delete('/:id', protect, listsController.deleteList)

module.exports = router
