const express = require('express')
// eslint-disable-next-line import/no-extraneous-dependencies
const dotenv = require('dotenv')

// eslint-disable-next-line import/no-extraneous-dependencies
const mongoSanitize = require('express-mongo-sanitize')
// eslint-disable-next-line import/no-extraneous-dependencies
const helmet = require('helmet')

const xss = require('xss-clean')

const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
const cors = require('cors')

const path = require('path')

const app = express()
const cookieParser = require('cookie-parser')
// eslint-disable-next-line no-unused-vars
const colors = require('colors')
// eslint-disable-next-line import/no-extraneous-dependencies
const fileUpload = require('express-fileupload')
const config = require('./config/config')
const errorHandler = require('./middleware/error')
const connectDB = require('./config/db')

// Route files
const transactionsRouter = require('./routes/transactions')
const usersRouter = require('./routes/users')
const authRouter = require('./routes/auth')
const categoriesRouter = require('./routes/categories')
const countriesRouter = require('./routes/countries')
const cryptoRouter = require('./routes/external')

// Body parser
app.use(express.json())

// Cookie parser
app.use(cookieParser())

// Load env variables
dotenv.config({ path: './config/config.env' })

// Connect to MongoDB
connectDB()

app.set('view engine', 'ejs')

const publicUrl = path.join(__dirname, '../public')

// Enable CORS
app.use(
  cors({
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    origin: [
      `http://localhost:${config.port}`,
      `http://localhost`,
      `https://localhost`,
      `https://techbudget.io`,
      `https://www.techbudget.io`,
    ],
  })
)

app.use('/assets', express.static(publicUrl))

if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line global-require
  const morgan = require('morgan')
  app.use(morgan('combined'))
}

// File upload
app.use(fileUpload())

const publicPath = path.join(__dirname, 'public')

app.use(express.static(publicPath))

// Sanitize data
app.use(mongoSanitize())

// Set security headers
app.use(
  helmet({
    // Avoid cors to access public folders
    crossOriginResourcePolicy: false,
  })
)

// Prevent XSS attacks
app.use(xss())

// Rate limiting
const limiter = rateLimit({
  windowMs: config.limiter.windowMs, // 10 minutes
  max: config.limiter.max, // 100 requests max
})
app.use(limiter)

// Prevent hpp param polution
app.use(hpp())

// Mount routers
app.use(`${config.apiUrl}/transactions`, transactionsRouter)
app.use(`${config.apiUrl}/users`, usersRouter)
app.use(`${config.apiUrl}/auth`, authRouter)
app.use(`${config.apiUrl}/categories`, categoriesRouter)
app.use(`${config.apiUrl}/countries`, countriesRouter)
app.use(`${config.apiUrl}/crypto`, cryptoRouter)

const uploadPath = path.join(__dirname, 'public/uploads')

// Access Upload Path
app.use(`${config.apiUrl}/public/uploads`, express.static(uploadPath))

app.use('/', (req, res) => {
  const actualDir = path.basename(path.resolve())
  const indexPath = path.join(__dirname, `../${actualDir}/public/index.html`)
  res.sendFile(indexPath)
})

app.use(errorHandler)

module.exports = app
