const { CustomError, AuthenticationError } = require('../lib/index');

CustomError.registerErrorType(AuthenticationError);
module.exports = AuthenticationError;
