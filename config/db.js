const mongoose = require('mongoose')

const connectDB = async () => {
  const isProd = process.env.NODE_ENV === 'production'
  const mongoUri = isProd
    ? process.env.MONGO_URI
    : process.env.MONGO_URI_DEV + process.env.MONGO_DB
  if (!isProd) {
    console.log(`Mongo DB: `.yellow + `${mongoUri}`.red)
  }

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
