import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from "../utils/emailService.js";

// Handle order-created event
export const handleOrderCreated = async (eventData) => {
  try {
    const { orderId, userId, items, totalAmount, address } = eventData;
    console.log(`Processing order created event: ${orderId}`);

    await orderModel.findByIdAndUpdate(orderId, {
      status: "confirmed",
      confirmedAt: new Date(),
    });

    const user = await userModel.findById(userId);
    if (user) {
      await sendOrderConfirmationEmail(user.email, { orderId, items, totalAmount, address });
    }

    console.log(`Order ${orderId} confirmed and email sent`);
  } catch (error) {
    console.error("Error handling order-created event:", error);
    throw error;
  }
};

// Handle order-status-update event
export const handleOrderStatusUpdate = async (eventData) => {
  try {
    const { orderId, status, userId } = eventData;
    console.log(`Processing order status update: ${orderId} → ${status}`);

    await orderModel.findByIdAndUpdate(orderId, {
      status,
      updatedAt: new Date(),
    });

    // Send status email if userId provided
    if (userId) {
      const user = await userModel.findById(userId);
      if (user) {
        await sendOrderStatusEmail(user.email, orderId, status);
      }
    }

    console.log(`Order ${orderId} status updated to ${status}`);
  } catch (error) {
    console.error("Error handling order-status-update event:", error);
    throw error;
  }
};