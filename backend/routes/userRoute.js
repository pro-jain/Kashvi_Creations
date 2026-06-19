import express from 'express';
const userRouter = express.Router();
import { registerUser, adminLogin, loginUser, sendOtp, verifyOtp, getAddresses, saveAddress, deleteAddress } from "../controllers/userController.js";
import authUser from "../middleware/auth.js";

userRouter.post('/register', registerUser);     // Step 1: send OTP
userRouter.post('/verify-otp', verifyOtp);      // Step 2: verify OTP → get token
userRouter.post('/login', loginUser);
userRouter.post('/admin', adminLogin);

// Saved addresses (auth required)
userRouter.post('/addresses', authUser, getAddresses);
userRouter.post('/address/save', authUser, saveAddress);
userRouter.post('/address/delete', authUser, deleteAddress);

export default userRouter;