// A small typed error so controllers can throw a clean, expected
// HTTP error and have the central error handler turn it into a
// proper JSON response.
export default class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}
