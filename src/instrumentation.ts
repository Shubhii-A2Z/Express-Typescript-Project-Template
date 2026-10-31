import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";

import { observabilityConfig } from "./config/observability.config"

const sdk = new NodeSDK({
    serviceName: observabilityConfig.service.name,

    ...(observabilityConfig.tracing.enabled && {
        traceExporter: new OTLPTraceExporter({
            url: `${observabilityConfig.tracing.exporterEndpoint}/v1/traces`,
        }),
    }),

    ...(observabilityConfig.metrics.enabled && {
        metricReaders: [
            new PeriodicExportingMetricReader({
                exporter: new OTLPMetricExporter({
                    url: `${observabilityConfig.tracing.exporterEndpoint}/v1/metrics`,
                }),
                exportIntervalMillis: 10000, // push every 10s
            }),
        ],
    }),

    ...(observabilityConfig.logs.enabled && {
        logRecordProcessors: [
            new BatchLogRecordProcessor({
                exporter: new OTLPLogExporter({
                    url: `${observabilityConfig.tracing.exporterEndpoint}/v1/logs`,
                }),
            }),
        ],
    }),

    instrumentations: [
        getNodeAutoInstrumentations({
            // fs instrumentation is very noisy — disable unless you need it
            "@opentelemetry/instrumentation-fs": { enabled: false },

            // IMPORTANT: disable this if you use OpenTelemetryTransportV3 in your
            // logger (logger.config.ts below). Having both active ships every log
            // to Loki TWICE.
            "@opentelemetry/instrumentation-winston": { enabled: false },
        }),
    ],
});

sdk.start();

process.on("SIGTERM", () => {
    sdk.shutdown()
        .then(() => console.log("OpenTelemetry terminated successfully"))
        .catch((error) => console.error("Error shutting down OpenTelemetry", error))
        .finally(() => process.exit(0));
});

export default sdk;