import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logger=winston.createLogger({
    // How the log should look like
    format: winston.format.combine(
        winston.format.timestamp({format: "MM-DD-YYYY HH:mm:ss"}), // How the timestamp should be formatted

        winston.format.json(), // Format log message as JSON
        
        winston.format.printf(({timestamp,level,message,...data})=>{ // Custom format of logger
            const output={level,message,timestamp,data};
            return JSON.stringify(output);
        }),
    ),
    
    // where should the log go
    transports: [
        new winston.transports.Console(), // Printing it to console

        new DailyRotateFile({ // Saving logs to a file
            filename: 'logs/%DATE%-application.logs', // fileName
            maxFiles: '2d', // Maximum logs/days
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true// compress old logs
        }),
    ]
});

export default logger;