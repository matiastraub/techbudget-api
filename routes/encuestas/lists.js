const express = require('express')
const router = express.Router()
const listsController = require('../../controllers/encuestas/lists')

// For example, if you have auth middleware:
const { protect } = require('../../middleware/auth')

// Routes

// Get all calls
router.get('/', protect, listsController.getLists)

// Get single call by ID
router.get('/:id', protect, listsController.getList)

// Create new call
router.post('/', protect, listsController.createList)

router.post('/upload', listsController.uploadListsFile)

// Update call by ID
router.put('/:id', protect, listsController.updateList)

// Delete call by ID
router.delete('/:id', protect, listsController.deleteList)

module.exports = router
