import { Kafka, logLevel } from "kafkajs";

const kafka = new Kafka({
  clientId: "kashvi-app",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  logLevel: logLevel.ERROR,
  connectionTimeout: 10000,
  requestTimeout: 30000,
});

export { kafka };
