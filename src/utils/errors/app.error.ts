// AppError class extends everything from Error (name,message) + extra
export abstract class AppError extends Error {
    public readonly statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
    }
}