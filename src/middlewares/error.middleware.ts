import { NextFunction, Request, Response } from "express";

import { AppError } from "../utils/errors/app.error";
import { StatusCodes } from "http-status-codes";

// This generic error handler will only handle errors which are of type AppError, else default error handler will be called
export function genericErrorHandler(err: Error,_: Request,resp: Response,next: NextFunction){

    // Defining error response format instead of default html format
    if(err instanceof AppError){
        return resp.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
    }

    resp.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message:"Internal Server Error",
    });
    
    next();
}