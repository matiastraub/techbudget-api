const fs = require('fs')
const mongoose = require('mongoose')

// Load env variables
// eslint-disable-next-line import/no-extraneous-dependencies
const dotenv = require('dotenv')

// Load models
const User = require('./models/User')

dotenv.config({ path: './config/config.env' })

// Connect to DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  // useCreateIndex: true, DEPRECATED
  // useFindAndModify: false, DEPRECATED
  useUnifiedTopology: true,
})

const users = JSON.parse(
  fs.readFileSync(`${__dirname}/data/users.json`, 'utf-8')
)
// console.log(`Mongo DB connected: ${conn.connection.host}`)

// Import into DB

const importData = async () => {
  try {
    await User.create(users)
    // console.log('data imported: ');
    process.exit()
  } catch (err) {
    // console.log('error seed ', err);
  }
}

const deleteData = async () => {
  try {
    /// console.log('DELETE ALLL');
    await User.deleteMany()
    // console.log('data deleted: '.red.inverse);
    process.exit()
  } catch (err) {
    //  console.log('error de;ete seed ', err);
  }
}

if (process.argv[2] === '-i') {
  importData()
} else if (process.argv[2] === '-d') {
  deleteData()
}
