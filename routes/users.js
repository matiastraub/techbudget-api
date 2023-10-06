const express = require('express');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

const {
  getUsers, getUser, createUser, updateUser,
  deleteUser, getUsersByRadius, updateDetails, userPhotoUpload, getAllFiles,
} = require('../controllers/users');

router
  .route('/')
  .get(protect, getUsers)
  .post(protect, createUser);

router
  .route('/:id')
  .get(protect, getUser)
  .put(protect, updateUser)
  .delete(protect, authorize('admin'), deleteUser);

router
  .route('/updatedetails/:id')
  .put(protect, updateDetails);

router
  .route('/radius/:zipcode/:distance')
  .get(getUsersByRadius);

router
  .route('/:id/photo')
  .put(protect, userPhotoUpload);

router
  .route('/:id/files')
  .get(protect, getAllFiles);

router
  .route('/:id/files/:album')
  .get(protect, getAllFiles);

module.exports = router;
