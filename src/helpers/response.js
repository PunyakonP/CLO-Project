const { OK } = require('http-status');

/**
 * Response Success
 * @param {Response} res the res of express
 * @param {IResponseSuccess} response the response failed
 * @return {Response} response
 */
exports.success = function (res, { status, result }) {
  return res.status(OK).json({ status, result });
}

/**
 * Response Failed
 * @param {Response} res the res of express
 * @param {IResponseFailed} response the response failed
 * @param {Number} statusCode optional status code
 * @return {Response} response
 */
exports.failed = function (res, { status, result }, statusCode) {
  return res.status(statusCode || OK).json({ status, result });
}
