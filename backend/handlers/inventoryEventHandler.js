import productModel from "../models/productModel.js";

// Handle inventory-update event
export const handleInventoryUpdate = async (eventData) => {
  try {
    const { orderId, items, action } = eventData;

    console.log(`Updating inventory for order: ${orderId}`);

    for (const item of items) {
      if (action === "reduce") {
        // Reduce stock
        await productModel.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
      } else if (action === "restore") {
        // Restore stock (for cancelled orders)
        await productModel.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity } },
          { new: true }
        );
      }
    }

    console.log(`Inventory updated for order ${orderId}`);
  } catch (error) {
    console.error("Error updating inventory:", error);
    throw error;
  }
};
