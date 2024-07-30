const app = require('./app')
const port = process.env.PORT || 1337

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `Server running on ${process.env.NODE_ENV} and port ${port}`.yellow.bold
  )
})

// Handle unhandle
process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.log('Unhandle rejections: ', err.message)
  // Close server
  server.close(() => process.exit(1))
})
