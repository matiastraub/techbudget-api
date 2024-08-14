const app = require('./app')
const port = process.env.PORT || 1337

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Enviroment: `.yellow + `${process.env.NODE_ENV}`.red)
  console.log(`Port: `.yellow + `${port}`.red)
})

// Handle unhandle
process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.log('Unhandle rejections: ', err.message)
  // Close server
  server.close(() => process.exit(1))
})
