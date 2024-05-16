"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * CustomError
 */
class CustomError extends Error {
    /**
     * Constructor
     * @param {ISerializedError} options
     */
    constructor({ code, type, message }) {
        super(message);
        this.code = null;
        this.type = 'CustomError';
        this.code = code;
        this.type = type;
    }
    /**
     * RegisterErrorType
     * @param {IError} ErrorType
     * @return {CustomError}
     */
    static registerErrorType(ErrorType) {
        if (this.errorTypes.includes(ErrorType))
            return this;
        this.errorTypes.push(ErrorType);
        return this;
    }
    /**
     * FromJSON
     * @param {ISerializedError} options
     * @return {CustomError}
     */
    static fromJSON({ type, message }) {
        const [error] = this.errorTypes;
        const FoundErrorType = this.errorTypes.find((errorType) => errorType.type === type) ?? error;
        return new FoundErrorType(message);
    }
    /**
     * To Json
     * @return {ISerializedError}
     */
    toJSON() {
        return {
            code: this.code,
            type: this.type,
            message: this.message,
        };
    }
}
CustomError.errorTypes = [];
CustomError.type = 'CustomError';
exports.default = CustomError;
//# sourceMappingURL=CustomError.js.map