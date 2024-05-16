import { IError } from '../interfaces/IError';
import CustomError from './CustomError';
/**
 * ResourceNotFound Error
 */
declare class ResourceNotFoundError extends CustomError implements IError {
    static type: string;
    name: string;
    /**
     * Constructor
     * @param {string} message
     */
    constructor(message: string);
}
export default ResourceNotFoundError;
