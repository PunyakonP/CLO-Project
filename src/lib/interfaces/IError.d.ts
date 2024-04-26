import { ISerializedError } from './ISerializedError';
import CustomError from '../errors/CustomError';
type ErrorConstructor = new (message: string) => CustomError;
export interface ErrorClass extends ErrorConstructor {
    type: string;
}
export interface IError {
    type: string;
    toJSON(): ISerializedError;
}
export {};
