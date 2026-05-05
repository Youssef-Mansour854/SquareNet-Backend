const ApiError = require("../utils/apiError");

const handleCastErrorDB = (err) =>
  new ApiError(`Invalid value for ${err.path}: ${err.value}`, 400);

const handleDuplicateKeyErrorDB = (err) => {
  const duplicatedValue = Object.values(err.keyValue || {}).join(", ");
  return new ApiError(`Duplicate field value: ${duplicatedValue}`, 400);
};

const handleValidationErrorDB = (err) => {
  const messages = Object.values(err.errors).map((value) => value.message);
  return new ApiError(messages.join(". "), 400);
};

const sendErrorForDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorForProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  return res.status(500).json({
    status: "error",
    message: "Something went wrong",
  });
};

const globalError = (err, req, res, next) => {
  let error = err;
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  if (process.env.NODE_ENV === "development") {
    return sendErrorForDev(error, res);
  }

  if (error.name === "CastError") {
    error = handleCastErrorDB(error);
  }

  if (error.code === 11000) {
    error = handleDuplicateKeyErrorDB(error);
  }

  if (error.name === "ValidationError") {
    error = handleValidationErrorDB(error);
  }

  return sendErrorForProd(error, res);
};

module.exports = globalError;
