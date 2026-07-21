import mongoose from "mongoose";

const userRegistrationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    verifyOtp: { type: String, default: '' },
    verifyOtpExpireAt: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, expires: 900 }, // auto-deleted if never verified within 15 minutes
})

const userRegistrationModel = mongoose.models.userRegistration || mongoose.model('userRegistration', userRegistrationSchema, 'userRegistration')

export default userRegistrationModel
