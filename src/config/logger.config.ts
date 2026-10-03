import os from 'os';
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize, errors, json, align } = winston.format;

// =========================================================================
// 1. Environment config
// =========================================================================
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';
const LOG_LEVEL = process.env.LOG_LEVEL || (IS_PROD ? 'info' : 'debug');
const SERVICE_NAME = process.env.SERVICE_NAME || 'app';
const TIMESTAMP_FORMAT = 'MM-DD-YYYY HH:mm:ss';

// =========================================================================
// 2. Request correlation (so every log line in a request shares one ID)
// =========================================================================
const requestContext = new AsyncLocalStorage<{ requestId: string }>();

export function getRequestId(): string | undefined {
    return requestContext.getStore()?.requestId;
}

// Injects requestId (if any) into every log line automatically
const withRequestId = winston.format((info) => {
    const requestId = getRequestId();
    if (requestId) info.requestId = requestId;
    return info;
});

// =========================================================================
// 3. Formats — readable in dev, pure JSON in prod
// =========================================================================
const consoleFormat = combine(
    withRequestId(),
    colorize({ all: true }),
    timestamp({ format: TIMESTAMP_FORMAT }),
    errors({ stack: true }),
    align(),
    printf(({ timestamp, level, message, stack, requestId, module, ...data }) => {
        const tag = module ? ` [${module}]` : '';
        const reqTag = requestId ? ` (req:${String(requestId).slice(0, 8)})` : '';
        const meta = Object.keys(data).length ? `\n${JSON.stringify(data, null, 2)}` : '';
        const log = `[${timestamp}]${tag}${reqTag} ${level}: ${message}${meta}`;
        return stack ? `${log}\n${stack}` : log;
    })
);

const fileFormat = combine(
    withRequestId(),
    timestamp({ format: TIMESTAMP_FORMAT }),
    errors({ stack: true }),
    json()
);

// =========================================================================
// 4. Base logger
// =========================================================================
const logger = winston.createLogger({
    level: LOG_LEVEL,
    format: fileFormat,
    // Attached to every single log line automatically
    defaultMeta: {
        service: SERVICE_NAME,
        env: NODE_ENV,
        hostname: os.hostname(),
        pid: process.pid,
    },
    transports: [
        new winston.transports.Console({
            format: consoleFormat,
            silent: process.env.NODE_ENV === 'test', // keep test output clean
        }),
        new DailyRotateFile({
            filename: 'logs/%DATE%-application.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: IS_PROD ? '14d' : '2d',
            zippedArchive: true,
            format: fileFormat,
        }),
        new DailyRotateFile({
            filename: 'logs/%DATE%-error.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxFiles: '30d',
            zippedArchive: true,
            format: fileFormat,
        }),
    ],
    exceptionHandlers: [
        new winston.transports.Console({ format: consoleFormat }),
        new DailyRotateFile({
            filename: 'logs/%DATE%-exceptions.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            format: fileFormat,
        }),
    ],
    rejectionHandlers: [
        new winston.transports.Console({ format: consoleFormat }),
        new DailyRotateFile({
            filename: 'logs/%DATE%-rejections.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            format: fileFormat,
        }),
    ],
    exitOnError: false, // don't crash the process on a handled exception log
});

// =========================================================================
// 5. Child logger factory — tag logs by module/service area
// =========================================================================
export function createModuleLogger(moduleName: string) {
    return logger.child({ module: moduleName });
}

// =========================================================================
// 6. Express middleware — tags each request with a correlation ID
//    and logs method/path/status/duration automatically
// =========================================================================
export function requestLoggerMiddleware() {
    return (req: any, res: any, next: () => void) => {
        const requestId = (req.headers['x-request-id'] as string) || randomUUID();
        res.setHeader('x-request-id', requestId);

        requestContext.run({ requestId }, () => {
            const start = Date.now();
            logger.info(`--> ${req.method} ${req.originalUrl}`);

            res.on('finish', () => {
                const duration = Date.now() - start;
                const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
                logger.log(level, `<-- ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
            });

            next();
        });
    };
}

// =========================================================================
// 7. Startup / shutdown helpers — nice to call from your entrypoint
// =========================================================================
export function logStartupBanner(port: number | string) {
    logger.info(`Starting "${SERVICE_NAME}" in "${NODE_ENV}" mode`);
    logger.info(`Server listening on port ${port}`);
}

export function attachGracefulShutdown(server: { close: (cb: () => void) => void }) {
    const shutdown = (signal: string) => {
        logger.warn(`Received ${signal}, shutting down gracefully...`);
        server.close(() => {
            logger.info('Server closed. Exiting process.');
            process.exit(0);
        });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

export default logger;