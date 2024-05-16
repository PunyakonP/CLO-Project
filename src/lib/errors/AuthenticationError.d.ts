import { IError } from '../interfaces/IError';
import CustomError from './CustomError';
/**
 * Authentication Error
 */
declare class AuthenticationError extends CustomError implements IError {
    static type: string;
    name: string;
    /**
     * Constructor
     * @param {string} message
     */
    constructor(message: string);
}
export default AuthenticationError;
