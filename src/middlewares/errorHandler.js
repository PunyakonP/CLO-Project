const {
  INTERNAL_SERVER_ERROR,
} = require('http-status');
const Logger = require('../helpers/Logger');
const CustomError = require('../errors/CustomError');
const { failed } = require('../helpers/response');
const {
  AuthenticationError,
  PermissionError,
  ResourceNotFoundError,
  ValidationError,
} = require('../errors');


/**
 * Error Handler
 * @param {CustomError} error the error
 * @param {Request} req express request
 * @param {Response} res express response
 * @param {NextFunction} next express next function
 * @return {Promise<Response>} response
 */
module.exports = function (error, req, res, next) {
  // Translate auth error from passport.js to our own error
  if (!(error instanceof AuthenticationError) && error.name === 'AuthenticationError') {
    error = new AuthenticationError(error.message);
  }

  const responseNormalFailed = {
    status: 'ERROR',
    result: error,
  };

  const responseFailed = {
    status: 'ERROR',
    result: {
      code: null,
      type: 'INTERNAL_SERVER_ERROR',
      message: 'Oops! something went wrong.',
    },
  };

  const errorMessageWithStack = String(error instanceof Error ? error.stack : error);

  Logger.error(String(errorMessageWithStack), { error: errorMessageWithStack });

  try {
    if (error instanceof AuthenticationError) {
      return failed(res, responseNormalFailed);
    } else if (error instanceof PermissionError) {
      return failed(res, responseNormalFailed);
    } else if (error instanceof ResourceNotFoundError) {
      return failed(res, responseNormalFailed);
    } else if (error instanceof ValidationError) {
      return failed(res, responseNormalFailed);
    } else {
      if (process.env.NODE_ENV !== 'production') {
        responseFailed.result.message = error instanceof Error ? error.message : error;
      }

      return failed(res, responseFailed, INTERNAL_SERVER_ERROR);
    }
  } catch (error) {
    Logger.error(`Failed to handle error: ${error.message}`, { stack: error.stack });
    return failed(res, responseFailed, INTERNAL_SERVER_ERROR);
  }
};