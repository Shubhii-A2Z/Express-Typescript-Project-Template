import { StatusCodes } from "http-status-codes";
import { AppError } from "./app.error";

export class BadRequestError extends AppError{
    constructor(message: string){
        super(message, StatusCodes.BAD_REQUEST);
    }
}