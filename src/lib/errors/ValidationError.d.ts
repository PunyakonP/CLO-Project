import { IError } from '../interfaces/IError';
import CustomError from './CustomError';
/**
 * Validation Error
 */
declare class ValidationError extends CustomError implements IError {
    static type: string;
    name: string;
    /**
     * Constructor
     * @param {string} message
     */
    constructor(message: string);
}
export default ValidationError;
