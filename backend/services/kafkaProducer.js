import { kafka } from "../config/kafka.js";

const producer = kafka.producer({
  idempotent: true,
  transactionTimeout: 30000,
  allowAutoTopicCreation: true,
});

// Initialize producer
export const initProducer = async () => {
  try {
    await producer.connect();
    console.log("Kafka Producer connected");
  } catch (error) {
    console.error("Failed to connect Kafka Producer:", error);
    throw error;
  }
};

// Publish events
const kafkaEnabled = process.env.ENABLE_KAFKA === "true";

export const publishEvent = async (topic, events) => {
    if (!kafkaEnabled) {
        console.log(`Kafka disabled. Skipping ${topic}`);
        return;
    }

    try {
        await producer.send({
            topic,
            messages: events.map((event) => ({
                key: event.key || null,
                value: JSON.stringify(event.value),
                headers: event.headers || {},
            })),
        });
    } catch (error) {
        console.error(error);
    }
};

// Disconnect producer
export const disconnectProducer = async () => {
  await producer.disconnect();
  console.log("Kafka Producer disconnected");
};
