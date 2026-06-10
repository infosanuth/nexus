import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import sessionModel from "../models/sessionModel.js";
import crypto from 'crypto';
import transporter from "../config/nodemailer.js";

// API to register user
const registerUser = async (req, res) => {

    try {
        const { name, email, password, phoneNumber } = req.body;

        // checking for all data to register user
        if (!name || !email || !password || !phoneNumber) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        // validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }
        //validating mobile number
        if (phoneNumber.length != 10) {
            return res.json({ success: false, message: "Enter valid phone number" })
        }
        if (phoneNumber[0] !== '0' || phoneNumber[1] !== '7') {
            return res.json({ success: false, message: "Enter valid phone number" });
        }
        // hashing user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name,
            email,
            phoneNumber,
            password: hashedPassword,
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' }) // expiresIn

        // Sending welcome email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Your account has been created',
            text: `Welcome to Nexus Hospital website. Your account has been created with email id: ${email}`
        }
        // await transporter.sendMail(mailOptions)


        res.json({ success: true, token })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message });
    }
}

// API to login user
const loginUser = async (req, res) => {

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "Invalid email" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' }) // expiresIn
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid password" })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// User verification otp send to the user's email
const sendVerifyOtp = async (req, res) => {

    try {
        const { userId } = req.body
        const user = await userModel.findById(userId)

        if (user.isAccountVerified) {
            return res.json({ success: false, message: "Account has been already verified" })
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000))
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 60 * 1000;

        await user.save()

        // Sending otp to email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Verification OTP',
            text: `Your OTP is ${otp}. Verify your account using this OTP.`
        }
        // await transporter.sendMail(mailOptions)
        console.log(mailOptions)

        return res.json({ success: true, message: "OTP sent to your email" })


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}
// Email verification using the OTP
const verifyEmail = async (req, res) => {
    try {

        const { userId, otp } = req.body

        if (!userId || !otp) {
            return res.json({ success: false, message: "Missing Details" })
        }

        const user = await userModel.findById(userId)

        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }

        if (user.verifyOtp === '' || user.verifyOtp !== otp) {
            return res.json({ success: false, message: "Invalid OTP" })
        }

        if (user.verifyOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: "OTP Expired" })
        }
        if (user.verifyOtp !== otp) {
            return res.json({ success: false, message: "Invalid OTP" })
        }

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;

        await user.save()

        return res.json({ success: true, message: "Email verified successfully" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}
// Check if user is authenticated
const isAuthenticated = async (req, res) => {
    try {

        return res.json({ success: true, })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}
// Send Password Rest OTP
const sendResetOtp = async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.json({ success: false, message: "Email is required" })
        }

        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000))
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 60 * 1000;

        await user.save()

        // Sending otp to email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            text: `Your OTP for resetting your password is ${otp}. Use this OTP to proceed with resetting your password.`
        }
        // await transporter.sendMail(mailOptions)
        console.log(mailOptions)

        return res.json({ success: true, message: "OTP sent to your email" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Reset user password
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.json({ success: false, message: "Email, OTP, and New Password are required" })
        }

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.json({ success: false, message: "User not found" })
        }
        if (user.resetOtp === "" || user.resetOtp !== otp) {
            return res.json({ success: false, message: "Invalid OTP" })
        }
        if (user.resetOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: "OTP Expired" })
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        user.password = hashedPassword
        user.resetOtp = ""
        user.resetOtpExpireAt = 0

        await user.save()

        return res.json({ success: true, message: "Password has been reset successfully" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user profile data
const getProfile = async (req, res) => {
    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({ success: true, userData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update user profile
const updateProfile = async (req, res) => {
    try {
        // const userId = req.body.userId 
        const { userId, name, phoneNumber, address, dob, gender, } = req.body;  // isAccountVerified
        const imageFile = req.file;

        if (!name || !phoneNumber || !dob || !gender) {
            return res.json({ success: false, message: "Data Missing" });
        }

        // Basic info update
        const updateData = {
            name,
            phoneNumber,
            address: JSON.parse(address),
            dob,
            gender,
        };


        // If image is uploaded, store its path
        if (imageFile) {
            // updateData.image = imageFile.path;
            updateData.image = `/uploads/${imageFile.filename}`;

        }

        await userModel.findByIdAndUpdate(userId, updateData);

        res.json({ success: true, message: 'Profile Updated' });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }

}

// Helper to convert "hh:mm AM/PM" slot time to 24-hour "HH:MM" for session matching
const convertTo24Hour = (time12h) => {
    const [time, modifier] = time12h.split(' ')
    let [hours, minutes] = time.split(':')
    if (hours === '12') {
        hours = '00'
    }
    if (modifier?.toUpperCase() === 'PM') {
        hours = String(Number(hours) + 12)
    }
    return `${hours.padStart(2, '0')}:${minutes}`
}

// API to book appointment
const bookAppointment = async (req, res) => {

    try {

        const { userId, docId, slotDate, slotTime, } = req.body

        const docData = await doctorModel.findById(docId).select("-password")


        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor Not Available' })
        }

        let slots_booked = docData.slots_booked

        // Find the active session (if any) this appointment falls into
        const [day, month, year] = slotDate.split('_').map(Number)
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0)
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)
        const slotTime24 = convertTo24Hour(slotTime)

        const sessionsOnDate = await sessionModel.find({
            doctorId: docId,
            status: 'active',
            date: { $gte: startOfDay, $lte: endOfDay }
        })

        const matchedSession = sessionsOnDate.find(s =>
            slotTime24 >= s.startTime && (!s.endTime || slotTime24 < s.endTime)
        )

        if (matchedSession) {
            // Session capacity governs availability, multiple patients can share the same slot time
            if (matchedSession.bookedPatientsCount >= matchedSession.maxPatients) {
                return res.json({ success: false, message: 'Session is fully booked' })
            }

            if (!slots_booked[slotDate]) {
                slots_booked[slotDate] = []
            }
            if (!slots_booked[slotDate].includes(slotTime)) {
                slots_booked[slotDate].push(slotTime)
            }
        } else {
            // checking for slot availablity
            if (slots_booked[slotDate]) {
                if (slots_booked[slotDate].includes(slotTime)) {
                    return res.json({ success: false, message: 'Doctor Not Available' })
                }
                else {
                    slots_booked[slotDate].push(slotTime)
                }
            } else {
                slots_booked[slotDate] = []
                slots_booked[slotDate].push(slotTime)
            }
        }

        const userData = await userModel.findById(userId).select("-password")

        delete docData.slots_booked

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }

        if (matchedSession) {
            appointmentData.sessionId = matchedSession._id
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        if (matchedSession) {
            matchedSession.appointments.push(newAppointment._id)
            matchedSession.bookedPatientsCount += 1
            await matchedSession.save()
        }

        // save new slots data in docData
        await doctorModel.findByIdAndUpdate(docId, { slots_booked })
        // console.log(appointmentData.userData.name)
        console.log(`Your appointment with ${docData.name} is confirmed for ${slotDate} at ${slotTime}. Thank you!`)
        res.json({ success: true, message: 'Appointment Booked' })


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
    try {

        const { userId } = req.body
        const appointments = await appointmentModel.find({ userId })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to make payment of appointment using payhere
const paymentPayHere = async (req, res) => {
    try {

        if (!process.env.PAYHERE_MERCHANT_ID) {
            return res.json({ success: false, message: 'Missing PAYHERE_MERCHANT_ID in backend environment' });
        }

        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        const fullName = appointmentData.userData.name || 'Unknown Patient';
        const [firstName, ...rest] = fullName.split(' ');
        const lastName = rest.join(' ') || ' ';

        const merchant_id = process.env.PAYHERE_MERCHANT_ID;
        const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET;
        const order_id = appointmentData._id.toString();
        const amount = Number(appointmentData.amount).toFixed(2);
        const currency = 'LKR';


        const hash = generatePayHereHash(merchant_id, order_id, amount, currency, merchant_secret);

        function generatePayHereHash(merchant_id, order_id, amount, currency, merchant_secret) {
            const formattedAmount = Number(amount).toFixed(2); // must be 2 decimal places
            const secretHash = crypto.createHash('md5').update(merchant_secret).digest('hex').toUpperCase();

            const rawString = merchant_id + order_id + formattedAmount + currency + secretHash;
            const finalHash = crypto.createHash('md5').update(rawString).digest('hex').toUpperCase();

            return finalHash;
        }

        const paymentDetails = {
            sandbox: true,
            merchant_id,
            return_url: 'http://localhost:5173/payment-success',
            cancel_url: 'http://localhost:5173/payment-cancel',
            notify_url: 'http://localhost:4000/api/payhere-notify',
            order_id,
            items: 'Doctor Appointment',
            amount,
            currency,
            first_name: firstName,
            last_name: lastName,
            email: appointmentData.userData.email || 'example@mail.com',
            phone: appointmentData.userData.phoneNumber || '0712345678',
            address: 'N/A',
            city: 'Colombo',
            country: 'Sri Lanka',
            hash,
        };

        res.json({ success: true, paymentDetails });

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to verify payment of payhere
const verifyPayhere = async (req, res) => {
    try {
        const { order_id } = req.body;

        await appointmentModel.findByIdAndUpdate(order_id, { payment: true });
        res.json({ success: true, message: "Payment Successful" })

    } catch (error) {
        console.error("PayHere Verify Error:", error);
        res.json({ success: false, message: error.message });
    }
};


const rescheduleAppointment = async (req, res) => {
    try {
        const { userId, appointmentId, newSlotDate, newSlotTime } = req.body;

        // 1. Find the existing appointment
        const appointment = await appointmentModel.findById(appointmentId);
        if (!appointment) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        // 2. Ensure the user is authorized
        if (appointment.userId.toString() !== userId) {
            return res.json({ success: false, message: "Unauthorized action" });
        }

        const { docId, slotDate: oldDate, slotTime: oldTime } = appointment;

        // 3. Fetch doctor
        const doctor = await doctorModel.findById(docId);
        if (!doctor) {
            return res.json({ success: false, message: "Doctor not found" });
        }

        // 4. Remove old slot from booked list
        if (doctor.slots_booked?.[oldDate]) {
            doctor.slots_booked[oldDate] = doctor.slots_booked[oldDate].filter(t => t !== oldTime);
            if (doctor.slots_booked[oldDate].length === 0) {
                delete doctor.slots_booked[oldDate];
            }
        }

        // 5. Check for double-booking in new slot
        if (!doctor.slots_booked[newSlotDate]) {
            doctor.slots_booked[newSlotDate] = [];
        }
        if (doctor.slots_booked[newSlotDate].includes(newSlotTime)) {
            return res.json({ success: false, message: "Selected slot already booked" });
        }

        // 6. Add new slot to booked list
        doctor.slots_booked[newSlotDate].push(newSlotTime);
        await doctor.save();

        // 7. Update the existing appointment with new slot and mark as rescheduled
        appointment.slotDate = newSlotDate;
        appointment.slotTime = newSlotTime;
        appointment.reSchedule = true; // ✅ Mark as rescheduled
        await appointment.save();

        return res.json({ success: true, message: "Appointment rescheduled successfully" });

    } catch (error) {
        console.error("Reschedule Error:", error);
        res.json({ success: false, message: error.message });
    }
};

const maximumAppointment = async (req, res) => {
try {
    // Count existing appointments for this user
        const existingAppointmentsCount = await appointmentModel.countDocuments({ userId });

        if (existingAppointmentsCount >= 3) {
            return res.json({ success: false, message:'' });
        }
    
} catch (error) {
    console.error(error);
}
}



export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, paymentPayHere, verifyPayhere, sendVerifyOtp, verifyEmail, isAuthenticated, sendResetOtp, resetPassword, rescheduleAppointment }

       