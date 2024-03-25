const path = require('path')
const fs = require('fs')
const ErrorResponse = require('../utils/ErrorResponse')
const asyncHandler = require('../middleware/async')
const User = require('../models/User')
const geocoder = require('../utils/geocoder')
const { isDir } = require('../utils/file')
const config = require('../config/config')

// @desc    Get all Users
// @route   GET /api/users
// @access  Private
exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find(req.query)
  res.status(200).json({ success: true, count: users.length, data: users })
})

// @desc    Update user details
// @route   PUT /api/user
// @access  Private
exports.updateDetails = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  }
  const user = await User.findOneAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  })
  res.status(200).json({ success: true, data: user })
})

// @desc    Get all Users
// @route   GET /api/users/:id
// @access  Private
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
  if (!user) {
    return next(new ErrorResponse(`Not found with id: ${req.params.id}`, 404))
  }
  return res.status(200).json({ success: true, data: user })
})

// @desc    Create a User
// @route   POST /api/users
// @access  Private
exports.createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body)
  res.status(201).json({ success: true, data: user })
})

// @desc    Update a given User
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
  if (!user) {
    return next(new ErrorResponse(`Not found with id: ${req.params.id}`, 404))
  }
  return res.status(200).json({ success: true, data: user })
})

// @desc    Delete a given User
// @route   DELETE /api/users/:id
// @access  Private
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id)
  if (!user) {
    return next(new ErrorResponse(`Not found with id: ${req.params.id}`, 404))
  }
  return res.status(200).json({ success: true, data: {} })
})

// @desc    Get users within a radius
// @route   GET /api/users/:zipcode/:distance
// @access  Private
exports.getUsersByRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params
  const loc = await geocoder.geocode(zipcode)
  const lat = loc[0].latitude
  const long = loc[0].longitude

  const geoKm = config.earthRadius.km
  const radius = distance / geoKm

  // eslint-disable-next-line max-len
  const user = await User.find({
    location: { $geoWithin: { $centerSphere: [[long, lat], radius] } },
  })

  if (!user) {
    return next(new ErrorResponse(`Not found with id: ${req.params.id}`, 404))
  }
  return res.status(200).json({ success: true, count: user.length, data: user })
})

// @desc    Upload picture for a given user
// @route   PUT /api/users/:id/photo
// @access  Private
exports.userPhotoUpload = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
  if (!user) {
    return next(
      new ErrorResponse(`User not found with id: ${req.params.id}`, 404)
    )
  }

  const uploadPath = `${process.env.FILE_UPLOAD_PATH}/users/${req.params.id}`

  // Create folder if it does not exist
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath)
  }

  if (!req.files) {
    return next(new ErrorResponse('Please upload a file', 400))
  }
  // return next(new ErrorResponse('Exiting process for testing', 400));
  const { file } = req.files
  // return res.status(200).json({ success: true, data: file });
  // Check whether image is a photo with valid extension
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse('Please upload an image file', 400))
  }

  // Check max size
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(new ErrorResponse('Upload limit reached', 400))
  }

  const { ext } = path.parse(file.name)
  const timestamp = new Date().getTime()
  // Rename file
  file.name = file.name.replace(/.(jpeg|jpg|png|gif|webp)/gi, '')
  file.name = `${file.name}_${timestamp}${ext}`
  file.mv(`${uploadPath}/${file.name}`, async (err) => {
    if (err) {
      next(new ErrorResponse(`Problem with file ${err}`, 500))
    }
    await User.findByIdAndUpdate(req.params.id, { photo: file.name })
  })
  return res.status(200).json({ success: true, data: file.name })
})

// @desc    Get all the files for a given user
// @route   PUT /api/users/:id/files
// @access  Private
exports.getAllFiles = asyncHandler(async (req, res, next) => {
  if (req.params.id !== req.user.id) {
    next(
      new ErrorResponse(
        'User not allowed to retrieve files from directory',
        500
      )
    )
  }

  const album = req.params.album ? `/${req.params.album}` : ''

  const myPath = `../public/uploads/users/${req.params.id}/${album}`

  const uploadPath = path.join(__dirname, myPath)

  //Create user folder if it does not exist
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath)
  }

  fs.readdir(uploadPath, async (err, files) => {
    if (err) {
      next(new ErrorResponse('Unable to scan directory', 500))
    }
    const doc = []

    if (!files) {
      next(new ErrorResponse('Files do not exist', 500))
    }
    files.forEach((file) => {
      const isFolder = isDir(fs, `${uploadPath}/${file}`)
      const obj = {
        file,
        name: file,
        isFolder,
      }
      doc.push(obj)
    })
    res.status(200).json({ success: true, count: doc.length, data: doc })
  })
})
