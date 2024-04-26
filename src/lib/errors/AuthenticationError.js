"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomError_1 = require("./CustomError");
/**
 * Authentication Error
 */
class AuthenticationError extends CustomError_1.default {
    /**
     * Constructor
     * @param {string} message
     */
    constructor(message) {
        super({ code: null, type: AuthenticationError.type, message });
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
AuthenticationError.type = 'AUTHENTICATION_ERROR';
CustomError_1.default.registerErrorType(AuthenticationError);
exports.default = AuthenticationError;
//# sourceMappingURL=AuthenticationError.js.map