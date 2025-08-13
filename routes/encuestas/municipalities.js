const express = require('express')
const router = express.Router()
const callsController = require('../../controllers/encuestas/municipalities')

// For example, if you have auth middleware:
const { protect } = require('../../middleware/auth')

// Routes

// Get all calls
router.get('/', protect, callsController.getMunicipalities)

// Get single call by ID
router.get('/:id', protect, callsController.getMunicipality)

// Create new call
router.post('/', protect, callsController.createMunicipality)

// Update call by ID
router.put('/:id', protect, callsController.updateMunicipality)

// Delete call by ID
router.delete('/:id', protect, callsController.deleteMunicipality)

module.exports = router
