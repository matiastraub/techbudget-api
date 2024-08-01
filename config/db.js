const mongoose = require('mongoose')

const connectDB = async () => {
  const mongoUri =
    process.env.NODE_ENV === 'production'
      ? process.env.MONGO_URI
      : process.env.MONGO_URI_DEV

  const conn = await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useCreateIndex: true,
    // useFindAndModify: false
  })
  // eslint-disable-next-line no-console
  console.log(`Mongo DB connected: ${conn.connection.host}`)
}

module.exports = connectDB
