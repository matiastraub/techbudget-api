const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')

const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
} = require('../controllers/categories')

const Category = require('../models/Category')
const advancedQueries = require('../middleware/advancedQueries')

router
  .route('/')
  //.get(protect, advancedQueries(Category), getCategories)
  .get(protect, getCategories)
  .post(protect, createCategory)

router.route('/:id').get(protect, getCategory).put(protect, updateCategory)

module.exports = router
