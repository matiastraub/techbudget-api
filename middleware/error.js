const ErrorResponse = require('../utils/ErrorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  let message = '';

  if (res.headerSent) {
    next(err);
  }

  // Mongoose bad objectId
  if (err.name === 'CastError') {
    message = 'Resource not found';
    error = new ErrorResponse(message, 404);
  }
  // Mongoose duplicate key
  if (err.name === 'MongoServerError' || err.code === 11000) {
    message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map((_error) => _error.message);
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({ success: false, error: err.message || 'Server error' });
};

module.exports = errorHandler;
