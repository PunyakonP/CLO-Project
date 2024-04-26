"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomError_1 = require("./CustomError");
/**
 * Validation Error
 */
class ValidationError extends CustomError_1.default {
    /**
     * Constructor
     * @param {string} message
     */
    constructor(message) {
        super({ code: null, type: ValidationError.type, message });
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
ValidationError.type = 'VALIDATION_ERROR';
CustomError_1.default.registerErrorType(ValidationError);
exports.default = ValidationError;
//# sourceMappingURL=ValidationError.js.map