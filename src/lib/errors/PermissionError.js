"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomError_1 = require("./CustomError");
/**
 * Permission Error
 */
class PermissionError extends CustomError_1.default {
    /**
     * Constructor
     * @param {string} message
     */
    constructor(message) {
        super({ code: null, type: PermissionError.type, message });
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
PermissionError.type = 'PERMISSION_ERROR';
CustomError_1.default.registerErrorType(PermissionError);
exports.default = PermissionError;
//# sourceMappingURL=PermissionError.js.map