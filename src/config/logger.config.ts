import winston from "winston";
import { OpenTelemetryTransportV3 } from "@opentelemetry/winston-transport";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PROD = NODE_ENV === "production";
const LOG_LEVEL = process.env.LOG_LEVEL || (IS_PROD ? "info" : "debug");
const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || "my-service";

// Clean, coloured format for local dev
const consoleFormat = combine(
    colorize({ all: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    printf(({ timestamp, level, message, ...meta }) => {
        const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
        return `[${timestamp}] ${level}: ${message}${extra}`;
    })
);

// JSON format for file outputs
const fileFormat = combine(timestamp(), errors({ stack: true }), json());

// Rotating file transport helper
const createRotateTransport = (level: string) =>
    new DailyRotateFile({
        dirname: "logs",
        filename: `${level}-%DATE%.log`,
        datePattern: "YYYY-MM-DD",
        level,
        maxFiles: IS_PROD ? "14d" : "3d",
        maxSize: "20m",
        zippedArchive: false,
        format: fileFormat,
    });

const logger = winston.createLogger({
    level: LOG_LEVEL,
    defaultMeta: { service: SERVICE_NAME, env: NODE_ENV },
    transports: [
        // Terminal
        new winston.transports.Console({
            format: consoleFormat,
            silent: NODE_ENV === "test",
        }),

        // Ships logs to OTel Collector → Loki (Grafana)
        new OpenTelemetryTransportV3(),

        // Local file rotation by level
        createRotateTransport("info"),  // info + warn + error
        createRotateTransport("warn"),  // warn + error
        createRotateTransport("error"), // error only
    ],
    exitOnError: false,
});

export default logger;