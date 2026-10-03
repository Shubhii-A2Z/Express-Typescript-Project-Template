import { Kafka } from "kafkajs";

export const kafka=new Kafka({
    clientId: "project-name",
    brokers: ["localhost:9092"]
});
