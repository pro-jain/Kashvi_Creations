import express from "express";
import {
  placeOrder,
  verifyRazorpayPayment,
  allOrders,
  userOrders,
  updateStatus,
} from "../controllers/orderController.js";
import authUser from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";

const orderRouter = express.Router();

orderRouter.post("/place", authUser, placeOrder);
orderRouter.post("/verify-payment", authUser, verifyRazorpayPayment);
orderRouter.post("/userorders", authUser, userOrders);   // ✅ POST (matches frontend)
orderRouter.post("/status", adminAuth, updateStatus);
orderRouter.get("/list", adminAuth, allOrders);

export default orderRouter;