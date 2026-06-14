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
export const publishEvent = async (topic, events) => {
  try {
    await producer.send({
      topic,
      messages: events.map((event) => ({
        key: event.key || null,
        value: JSON.stringify(event.value),
        headers: event.headers || {},
      })),
    });
    console.log(`Event published to ${topic}`);
  } catch (error) {
    console.error(`Error publishing to ${topic}:`, error);
    throw error;
  }
};

// Disconnect producer
export const disconnectProducer = async () => {
  await producer.disconnect();
  console.log("Kafka Producer disconnected");
};
