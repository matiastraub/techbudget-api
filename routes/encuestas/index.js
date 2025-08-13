const express = require('express')

const router = express.Router()

const municipalitiesRouter = require('./municipalities')
const listsRouter = require('./lists')

router.use('/municipalities', municipalitiesRouter)
router.use('/lists', listsRouter)

module.exports = router
