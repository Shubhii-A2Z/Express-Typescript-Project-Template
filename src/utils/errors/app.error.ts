import { StatusCodes } from "http-status-codes";

// AppError interface extends everything from Error (name,message) + extra
export interface AppError extends Error{
    statusCode: number;
}

export class InternalServerError implements AppError{
    name: string;
    statusCode: number;
    message: string;
    constructor(message: string){
        this.name="InternalServerError"
        this.statusCode=StatusCodes.INTERNAL_SERVER_ERROR;
        this.message=message;
    }
}

export class NotFoundError implements AppError{
    name: string;
    statusCode: number;
    message: string;
    constructor(message: string){
        this.name="NotFoundError"
        this.statusCode=StatusCodes.NOT_FOUND;
        this.message=message;
    }
}

export class UnauthorizedAccess implements AppError{
    name: string;
    statusCode: number;
    message: string;
    constructor(message: string){
        this.name="UnauthorizedAccess"
        this.statusCode=StatusCodes.UNAUTHORIZED;
        this.message=message;
    }
}