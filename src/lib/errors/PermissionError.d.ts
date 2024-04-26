import { IError } from '../interfaces/IError';
import CustomError from './CustomError';
/**
 * Permission Error
 */
declare class PermissionError extends CustomError implements IError {
    static type: string;
    name: string;
    /**
     * Constructor
     * @param {string} message
     */
    constructor(message: string);
}
export default PermissionError;
