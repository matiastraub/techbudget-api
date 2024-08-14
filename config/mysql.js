require('dotenv').config({ path: './config/config.env' })
const isProd = process.env.NODE_ENV === 'production'
const mysql = require('mysql')

const connection = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
}

if (!isProd) {
  console.log(`MySQL DB: `.yellow + `${connection.database}`.red)
}

const pool = mysql.createPool(connection)

module.exports = pool
