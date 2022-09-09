/**
 * Custom error designed for invalid inputs.
 * Use it when performing input validation.
 * @param message Error message.
 * @constructor Error.
 */
function ValidationError (message) {
  this.name = 'ValidationError';
  this.message = message;
  this.stack = (new Error()).stack;
}

ValidationError.prototype = new Error;

export {ValidationError};