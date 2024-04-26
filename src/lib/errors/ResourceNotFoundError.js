"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomError_1 = require("./CustomError");
/**
 * ResourceNotFound Error
 */
class ResourceNotFoundError extends CustomError_1.default {
    /**
     * Constructor
     * @param {string} message
     */
    constructor(message) {
        super({ code: null, type: ResourceNotFoundError.type, message });
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
ResourceNotFoundError.type = 'RESOURCE_NOT_FOUND_ERROR';
CustomError_1.default.registerErrorType(ResourceNotFoundError);
exports.default = ResourceNotFoundError;
//# sourceMappingURL=ResourceNotFoundError.js.map