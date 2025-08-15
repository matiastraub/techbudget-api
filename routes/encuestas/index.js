const express = require('express')

const router = express.Router()

const municipalitiesRouter = require('./municipalities')
const listsRouter = require('./lists')
const listAttemptsRouter = require('./listAttempts')

router.use('/municipalities', municipalitiesRouter)
router.use('/lists', listsRouter)
router.use('/list-attempts', listAttemptsRouter)

module.exports = router
