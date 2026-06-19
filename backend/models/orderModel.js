import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: { type: Array, required: true },
  address: { type: Object, required: true },
  status: { type: String, default: "pending", enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"] },
  paymentStatus: { type: String, default: "pending", enum: ["pending", "success", "failed"] },
  paymentId: { type: String },
  date: { type: Number, required: true },
  confirmedAt: { type: Date },
  paymentDate: { type: Date },
  updatedAt: { type: Date, default: Date.now },
});

const orderModel = mongoose.models.Orders || mongoose.model("Orders", orderSchema,"Orders");

export default orderModel;