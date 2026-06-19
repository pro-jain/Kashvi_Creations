import { kafka } from "../config/kafka.js";
import { handleOrderCreated, handleOrderStatusUpdate } from "../handlers/orderEventHandler.js";  // ← add handleOrderStatusUpdate
import { handlePaymentProcessed } from "../handlers/paymentEventHandler.js";
import { handleInventoryUpdate } from "../handlers/inventoryEventHandler.js";

const consumer = kafka.consumer({ groupId: "kashvi-app-group-v2" });

const processWithRetry = async (handler, data, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await handler(data);
      return;
    } catch (err) {
      console.error(`Attempt ${i + 1} failed:`, err.message);
      if (i === retries - 1) {
        console.error("All retries exhausted — message needs manual review:", data);
      }
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
};

export const initConsumer = async () => {

  if(process.env.ENABLE_KAFKA !== "true"){
      console.log("Kafka Consumer Disabled");
      return;
  }
  try {
    await consumer.connect();
    console.log("Kafka Consumer connected");

    await consumer.subscribe({
      topics: [
        "order-created",
        "payment-processed",
        "inventory-update",
        "order-status-update",   // ← add this
      ],
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const eventData = JSON.parse(message.value.toString());

          switch (topic) {
            case "order-created":
              await processWithRetry(handleOrderCreated, eventData);
              break;
            case "payment-processed":
              await processWithRetry(handlePaymentProcessed, eventData);
              break;
            case "inventory-update":
              await processWithRetry(handleInventoryUpdate, eventData);
              break;
            case "order-status-update":              // ← add this case
              await processWithRetry(handleOrderStatusUpdate, eventData);
              break;
            default:
              console.log(`Unknown topic: ${topic}`);
          }
        } catch (error) {
          console.error(`Error processing message from ${topic}:`, error);
        }
      },
    });
  } catch (error) {
    console.error("Failed to initialize Kafka Consumer:", error);
    throw error;
  }
};

export const disconnectConsumer = async () => {

  if(process.env.ENABLE_KAFKA !== "true")
      return;

  await consumer.disconnect();
  console.log("Kafka Consumer disconnected");
};
