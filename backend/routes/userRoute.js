import express from 'express'
import { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, rescheduleAppointment, paymentPayHere, verifyPayhere, sendVerifyOtp, verifyEmail, isAuthenticated, sendResetOtp, resetPassword } from '../controllers/userController.js'
import authUser from '../middleware/authUser.js';
import upload from '../middleware/multer.js';

const userRouter = express.Router();

userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)

userRouter.get("/get-profile", authUser, getProfile)
userRouter.post('/update-profile', authUser, upload.single('image'), updateProfile)
userRouter.post('/book-appointment', authUser, bookAppointment)
userRouter.get('/appointments', authUser, listAppointment)
userRouter.post('/cancel-appointment', authUser, cancelAppointment)
userRouter.post('/reschedule-appointment', authUser, rescheduleAppointment)
userRouter.post('/payment-payhere', authUser, paymentPayHere)
userRouter.post('/verifyPayhere', authUser, verifyPayhere)
userRouter.post('/send-verify-otp', sendVerifyOtp)
userRouter.post('/verify-account', verifyEmail)
userRouter.get('/is-auth', authUser, isAuthenticated)
userRouter.post('/send-reset-otp', sendResetOtp)
userRouter.post('/reset-password', resetPassword)

export default userRouter