import orderModel from "../models/orderModel.js";
import { publishEvent } from "../services/kafkaProducer.js";

// Handle payment-processed event
export const handlePaymentProcessed = async (eventData) => {
  try {
    const { orderId, paymentId, amount, status } = eventData;

    console.log(`Processing payment: ${paymentId} for order: ${orderId}`);

    // Update order with payment details
    const order = await orderModel.findByIdAndUpdate(
      orderId,
      {
        paymentId,
        paymentStatus: status,
        paymentDate: new Date(),
      },
      { new: true }
    );

    if (status === "success") {
      // Publish inventory-update event
      await publishEvent("inventory-update", [
        {
          key: orderId,
          value: {
            orderId,
            items: order.items,
            action: "reduce",
            timestamp: new Date(),
          },
        },
      ]);

      console.log(`Payment successful for order ${orderId}, inventory update triggered`);
    } else {
      console.log(`Payment failed for order ${orderId}`);
    }
  } catch (error) {
    console.error("Error handling payment-processed event:", error);
    throw error;
  }
};
