import { IError, ErrorClass } from '../interfaces/IError';
import { ISerializedError } from '../interfaces/ISerializedError';
/**
 * CustomError
 */
export default class CustomError extends Error implements IError {
    private static errorTypes;
    static type: string;
    code: null | string;
    type: string;
    /**
     * Constructor
     * @param {ISerializedError} options
     */
    constructor({ code, type, message }: ISerializedError);
    /**
     * RegisterErrorType
     * @param {IError} ErrorType
     * @return {CustomError}
     */
    static registerErrorType(ErrorType: ErrorClass): new (args: ISerializedError) => CustomError;
    /**
     * FromJSON
     * @param {ISerializedError} options
     * @return {CustomError}
     */
    static fromJSON({ type, message }: ISerializedError): CustomError;
    /**
     * To Json
     * @return {ISerializedError}
     */
    toJSON(): ISerializedError;
}
