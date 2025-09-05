const express = require('express')
const router = express.Router()
const controller = require('../../controllers/encuestas/campaigns')

// For example, if you have auth middleware:
const { protect } = require('../../middleware/auth')

// Routes

// Get all campaigns

router.get('/', protect, controller.getCampaignsRequest)

// Get single list item by ID
router.get('/:id', protect, controller.getCampaignsRequestById)

// // Create new list
// router.post('/', protect, controller.createList)
// // Upload list
// router.post('/upload', protect, controller.uploadListsFile)

// // Process the list
// router.post('/process', protect, controller.processList)

// // Update list by ID
// router.put('/:id', protect, controller.updateList)

// // Delete list by ID
// router.delete('/:id', protect, controller.deleteList)

module.exports = router
