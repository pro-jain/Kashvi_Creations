import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import { publishEvent } from "../services/kafkaProducer.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Place order — works for both COD and Razorpay
const placeOrder = async (req, res) => {
  try {
    const { address, items, paymentMethod } = req.body;
    const userId = req.userId;

    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const newOrder = new orderModel({
      userId,
      items,
      address,
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: paymentMethod || "cod",
      date: Date.now(),
    });

    await newOrder.save();
    const orderId = newOrder._id.toString();

    if (paymentMethod === "razorpay") {
      // Create Razorpay order — return to frontend for payment modal
      const razorpayOrder = await razorpay.orders.create({
        amount: totalAmount * 100, // paise
        currency: "INR",
        receipt: orderId,
      });

      return res.json({
        success: true,
        razorpay: true,
        orderId,
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount * 100,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    }

    // COD flow — publish order-created directly
    await publishEvent("order-created", [
      {
        key: orderId,
        value: { orderId, userId, items, totalAmount, address, timestamp: new Date() },
      },
    ]);

    res.json({ success: true, orderId, message: "Order placed successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Verify Razorpay payment — called after user completes payment modal
const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    // Verify signature — this proves payment is genuine, not tampered
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      // Signature mismatch — payment is fake or tampered
      await publishEvent("payment-processed", [
        {
          key: orderId,
          value: {
            orderId,
            paymentId: razorpayPaymentId,
            amount: 0,
            status: "failed",
            timestamp: new Date(),
          },
        },
      ]);
      return res.json({ success: false, message: "Payment verification failed" });
    }

    // Signature valid — fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    const order = await orderModel.findById(orderId);

    // Publish payment-processed → triggers inventory-update automatically via handler
    await publishEvent("payment-processed", [
      {
        key: orderId,
        value: {
          orderId,
          paymentId: razorpayPaymentId,
          amount: payment.amount / 100,
          status: "success",
          timestamp: new Date(),
        },
      },
    ]);

    // Also publish order-created so confirmation email fires
    await publishEvent("order-created", [
      {
        key: orderId,
        value: {
          orderId,
          userId: order.userId.toString(),
          items: order.items,
          totalAmount: payment.amount / 100,
          address: order.address,
          timestamp: new Date(),
        },
      },
    ]);

    res.json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Admin — get all orders
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}).sort({ date: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// User — get their orders
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.userId }).sort({ date: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Admin — update order status
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const order = await orderModel.findById(orderId);
    if (!order) return res.json({ success: false, message: "Order not found" });

    await orderModel.findByIdAndUpdate(orderId, { status, updatedAt: new Date() });

    await publishEvent("order-status-update", [
      {
        key: orderId,
        value: {
          orderId,
          status,
          userId: order.userId.toString(),
          timestamp: new Date(),
        },
      },
    ]);

    res.json({ success: true, message: "Status updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export { placeOrder, verifyRazorpayPayment, allOrders, userOrders, updateStatus };