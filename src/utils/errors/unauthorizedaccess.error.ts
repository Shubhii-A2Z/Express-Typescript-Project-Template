import { StatusCodes } from "http-status-codes";
import { AppError } from "./app.error";

export class UnauthorizedAccess extends AppError{
    constructor(message: string){
        super(message, StatusCodes.UNAUTHORIZED);
    }
}