const { CustomError, ResourceNotFoundError } = require('../lib/index');

CustomError.registerErrorType(ResourceNotFoundError);
module.exports = ResourceNotFoundError;
