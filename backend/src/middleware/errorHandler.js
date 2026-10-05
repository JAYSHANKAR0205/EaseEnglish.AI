const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const isDev = process.env.NODE_ENV === 'development';

  // Structured server log without leaking secrets
  console.error(`[Error] ${req.method} ${req.originalUrl} - ${err.message}`);

  res.status(statusCode).json({
    success: false,
    error: err.message || 'An unexpected error occurred. Please try again.',
    ...(isDev && { stack: err.stack })
  });
};

module.exports = errorHandler;
