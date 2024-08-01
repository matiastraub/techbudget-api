const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')

const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categories')

router.route('/').get(protect, getCategories).post(protect, createCategory)

router
  .route('/:id')
  .get(protect, getCategory)
  .put(protect, updateCategory)
  .delete(protect, deleteCategory)

module.exports = router
