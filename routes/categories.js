const express = require('express')

const router = express.Router()
const { protect } = require('../middleware/auth')

const {
  getCategories,
  getCategory,
  createCategory,
} = require('../controllers/categories')

const Category = require('../models/Category')
const advancedQueries = require('../middleware/advancedQueries')

router
  .route('/')
  .get(protect, advancedQueries(Category), getCategories)
  .post(protect, createCategory)

router.route('/:id').get(protect, getCategory)

module.exports = router
