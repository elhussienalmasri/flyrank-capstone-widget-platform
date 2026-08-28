// Wraps an async route/controller function so any thrown error or
// rejected promise is forwarded to Express's error handler instead
// of crashing the process or hanging the request.
export default function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
