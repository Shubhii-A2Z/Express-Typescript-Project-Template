export const observabilityConfig = {
    service: {
        name: process.env.OTEL_SERVICE_NAME ?? "my-service",
        environment: process.env.NODE_ENV ?? "development",
    },

    metrics: {
        enabled: process.env.METRICS_ENABLED !== "false",
        path: process.env.METRICS_PATH ?? "/actuator/prometheus",
    },

    tracing: {
        enabled: process.env.OTEL_TRACING_ENABLED !== "false",
        exporterEndpoint:
            process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://localhost:4318",
    },

    logs: {
        enabled: process.env.OTEL_LOGS_ENABLED !== "false",
    },
} as const;