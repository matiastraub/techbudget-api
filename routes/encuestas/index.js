const express = require('express')

const router = express.Router()

const municipalitiesRouter = require('./municipalities')
const listsRouter = require('./lists')
const listAttemptsRouter = require('./listAttempts')
const listAttemptsQueriesRouter = require('./listAttemptsQueries')
const ultravoxSessionsRouter = require('./ultravoxSessions')
const campaignsRouter = require('./campaigns')
const sseRouter = require('./sse')
const ultravoxRouter = require('./ultravox')

router.use('/municipalities', municipalitiesRouter)
router.use('/lists', listsRouter)
router.use('/list-attempts', listAttemptsRouter)
router.use('/ultravox-sessions', ultravoxSessionsRouter)
router.use('/list-queries', listAttemptsQueriesRouter)
router.use('/campaigns', campaignsRouter)
router.use('/sse', sseRouter)
router.use('/ultravox', ultravoxRouter)

module.exports = router
