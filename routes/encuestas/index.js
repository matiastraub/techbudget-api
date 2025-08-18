const express = require('express')

const router = express.Router()

const municipalitiesRouter = require('./municipalities')
const listsRouter = require('./lists')
const listAttemptsRouter = require('./listAttempts')
const listAttemptsQueriesRouter = require('./listAttemptsQueries')
const ultravoxSessionsRouter = require('./ultravoxSessions')

router.use('/municipalities', municipalitiesRouter)
router.use('/lists', listsRouter)
router.use('/list-attempts', listAttemptsRouter)
router.use('/ultravox-sessions', ultravoxSessionsRouter)
router.use('/list-queries', listAttemptsQueriesRouter)
module.exports = router
