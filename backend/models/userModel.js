import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone:    { type: String, default: '' },
    cartData: {  type: Map,
    of: Number,
    default: {} },
    addresses: {
        type: [{
            label:     { type: String, default: 'Home' },
            firstName: String,
            lastName:  String,
            street:    String,
            city:      String,
            state:     String,
            zipcode:   String,
            country:   String,
            phone:     String,
            isDefault: { type: Boolean, default: false }
        }],
        default: []
    },
    isVerified: { type: Boolean, default: false },
    otp:        { type: String, default: null },
    otpExpiry:  { type: Date, default: null },
}, { minimize: false });

const userModel = mongoose.models.Users || mongoose.model('Users', userSchema, 'Users');
export default userModel;