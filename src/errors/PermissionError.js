const { CustomError, PermissionError } = require('../lib/index');

CustomError.registerErrorType(PermissionError);
module.exports = PermissionError;
