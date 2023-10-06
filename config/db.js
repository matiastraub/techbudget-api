const mongoose = require('mongoose');

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // useCreateIndex: true,
    // useFindAndModify: false
  });
  // eslint-disable-next-line no-console
  console.log(`Mongo DB connected: ${conn.connection.host}`);
};

module.exports = connectDB;
