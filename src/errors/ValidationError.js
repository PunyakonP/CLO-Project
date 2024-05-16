const { CustomError, ValidationError } = require('../lib/index');

CustomError.registerErrorType(ValidationError);
module.exports = ValidationError;
