import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodObject } from "zod";

export const validateRequestBody=(schema:ZodObject)=>{
    return async (req:Request,resp:Response,next:NextFunction)=>{
        try {
            await schema.parseAsync(req.body);
            next();
        } catch (error) {
            return resp.status(StatusCodes.BAD_REQUEST).json({
                mssg: 'Invalid Request Body',
                success: false,
                error: error
            });
        }
    }
}