const errorMiddleware = (err, req, res, next) => {
  console.error('Unhandled server error:', err);

  const status = err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred on the server.';
  
  res.status(status).json({
    message,
    errors: err.errors || null,
    // Only expose stack traces in development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorMiddleware;
