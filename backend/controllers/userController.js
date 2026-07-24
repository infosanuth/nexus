import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import userRegistrationModel from "../models/userRegistrationModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import sessionModel from "../models/sessionModel.js";
import specialityModel from "../models/specialityModel.js";
import crypto from 'crypto';
import transporter from "../config/nodemailer.js";
import { sendSMS } from "../config/twilio.js";

// Generates an OTP, saves it on the user, and emails it for account verification
const sendAccountVerificationOtp = async (user) => {
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    user.verifyOtp = otp;
    user.verifyOtpExpireAt = Date.now() + 60 * 1000;

    await user.save()

    const mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: 'Account Verification OTP',
        text: `Your OTP is ${otp}. Verify your account using this OTP.`
    }
    await transporter.sendMail(mailOptions)
    console.log(mailOptions)
}

// Derives date of birth and gender from a Sri Lankan NIC (old: 10 chars, new: 12 digits)
const getDobAndGenderFromNic = (nic) => {
    let year
    let dayCode

    if (nic.length === 10) {
        year = 1900 + Number(nic.substring(0, 2))
        dayCode = Number(nic.substring(2, 5))
    } else {
        year = Number(nic.substring(0, 4))
        dayCode = Number(nic.substring(4, 7))
    }

    let gender = "Male"
    let dayOfYear = dayCode
    if (dayCode > 500) {
        gender = "Female"
        dayOfYear = dayCode - 500
    }

    const dobDate = new Date(year, 0, dayOfYear)
    const dob = `${dobDate.getFullYear()}-${String(dobDate.getMonth() + 1).padStart(2, '0')}-${String(dobDate.getDate()).padStart(2, '0')}`

    return { dob, gender }
}

// API to register user
const registerUser = async (req, res) => {

    try {
        const { name, email, password, phoneNumber, nic } = req.body;

        // checking for all data to register user
        if (!name || !email || !password || !phoneNumber || !nic) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        // validating NIC length (old format: 10 chars, new format: 12 chars)
        if (nic.length < 10 || nic.length > 12) {
            return res.json({ success: false, message: "Enter valid NIC" })
        }

        // validating NIC format based on length
        if (nic.length === 10) {
            for (let i = 0; i < 9; i++) {
                if (nic[i] < '0' || nic[i] > '9') {
                    return res.json({ success: false, message: "Enter valid NIC" })
                }
            }
            const lastChar = nic[9].toLowerCase()
            if (lastChar !== 'v' && lastChar !== 'x') {
                return res.json({ success: false, message: "Enter valid NIC" })
            }
        } else if (nic.length === 12) {
            for (let i = 0; i < 12; i++) {
                if (nic[i] < '0' || nic[i] > '9') {
                    return res.json({ success: false, message: "Enter valid NIC" })
                }
            }
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        // validating password length
        if (password.length < 8 || password.length > 20) {
            return res.json({ success: false, message: "Password must be 8-20 characters long" })
        }

        // validating password has at least one digit
        let hasDigit = false
        for (let i = 0; i < password.length; i++) {
            if (password[i] >= '0' && password[i] <= '9') {
                hasDigit = true
                break
            }
        }
        if (!hasDigit) {
            return res.json({ success: false, message: "Password must contain at least one digit" })
        }

        // validating password has at least one letter
        let hasLetter = false
        for (let i = 0; i < password.length; i++) {
            const ch = password[i]
            if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
                hasLetter = true
                break
            }
        }
        if (!hasLetter) {
            return res.json({ success: false, message: "Password must contain at least one letter" })
        }
        //validating mobile number
        if (phoneNumber.length != 10) {
            return res.json({ success: false, message: "Enter valid phone number" })
        }
        if (phoneNumber[0] !== '0' || phoneNumber[1] !== '7') {
            return res.json({ success: false, message: "Enter valid phone number" });
        }

        // an already-verified account with this email/phone/NIC exists, refuse to overwrite it
        const existingUser = await userModel.findOne({ $or: [{ email }, { phoneNumber }, { nic }] })
        if (existingUser) {
            return res.json({ success: false, message: "Email, phone number or NIC already registered" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)

        // hold the signup as pending until the OTP is confirmed; re-submitting refreshes it
        const userRegistration = await userRegistrationModel.findOneAndUpdate(
            { email },
            { name, email, phoneNumber, nic, password: hashedPassword },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        )

        await sendAccountVerificationOtp(userRegistration)

        res.json({ success: true, email })
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

// Resend the verification OTP for a pending (not-yet-created) signup
const sendVerifyOtp = async (req, res) => {

    try {
        const { email } = req.body
        const userRegistration = await userRegistrationModel.findOne({ email })

        if (!userRegistration) {
            return res.json({ success: false, message: "No pending signup found for this email" })
        }

        await sendAccountVerificationOtp(userRegistration)

        return res.json({ success: true, message: "OTP sent to your email" })


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}
// Confirms the OTP for a pending signup, then creates the real account
const verifyEmail = async (req, res) => {
    try {

        const { email, otp } = req.body

        if (!email || !otp) {
            return res.json({ success: false, message: "Missing Details" })
        }

        const userRegistration = await userRegistrationModel.findOne({ email })

        if (!userRegistration) {
            return res.json({ success: false, message: "No pending signup found for this email" })
        }

        if (userRegistration.verifyOtp === '' || userRegistration.verifyOtp !== otp) {
            return res.json({ success: false, message: "Invalid OTP" })
        }

        if (userRegistration.verifyOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: "OTP Expired" })
        }

        const { dob, gender } = getDobAndGenderFromNic(userRegistration.nic)

        const newUser = new userModel({
            name: userRegistration.name,
            email: userRegistration.email,
            phoneNumber: userRegistration.phoneNumber,
            nic: userRegistration.nic,
            password: userRegistration.password,
            dob,
            gender,
            isAccountVerified: true,
        })
        const user = await newUser.save()

        await userRegistrationModel.deleteOne({ email })

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

        return res.json({ success: true, message: "Email verified successfully", token })

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

        const hospitalCharge = (await specialityModel.findOne({ speciality: docData.speciality }))?.channelingFee ?? 0

        // Calculate token number for this slot/session
        let tokenNumber
        if (matchedSession) {
            tokenNumber = matchedSession.bookedPatientsCount + 1
        } else {
            const existingCount = await appointmentModel.countDocuments({ docId, slotDate, slotTime, cancelled: false })
            tokenNumber = existingCount + 1
        }

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees + hospitalCharge,
            slotTime,
            slotDate,
            date: Date.now(),
            tokenNumber
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

        res.json({ success: true, message: 'Appointment Booked', appointmentId: newAppointment._id })


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

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {

        const { userId, appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        // verify appointment user 
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: 'Unauthorized action' })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        // releasing session slot, if this appointment belonged to a session
        if (appointmentData.sessionId) {
            await sessionModel.findByIdAndUpdate(appointmentData.sessionId, {
                $pull: { appointments: appointmentData._id },
                $inc: { bookedPatientsCount: -1 }
            })
        }

        // releasing doctor slot
        const { docId, slotDate, slotTime } = appointmentData

        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked

        // slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);
        if (slots_booked[slotDate].length === 0) {
            delete slots_booked[slotDate];
        }

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to reschedule appointment (same doctor, new date/time)
const rescheduleAppointment = async (req, res) => {
    try {

        const { userId, appointmentId, slotDate: newSlotDate, slotTime: newSlotTime } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' })
        }

        // verify appointment user
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: 'Unauthorized action' })
        }

        if (!appointmentData.payment || appointmentData.reSchedule || appointmentData.cancelled || appointmentData.isCompleted) {
            return res.json({ success: false, message: 'This appointment cannot be rescheduled' })
        }

        const { docId, slotDate: oldSlotDate, slotTime: oldSlotTime, sessionId: oldSessionId } = appointmentData

        if (oldSlotDate === newSlotDate && oldSlotTime === newSlotTime) {
            return res.json({ success: false, message: 'Please select a different slot' })
        }

        const docData = await doctorModel.findById(docId)

        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor Not Available' })
        }

        let slots_booked = docData.slots_booked

        // Find the active session (if any) the new slot falls into
        const [day, month, year] = newSlotDate.split('_').map(Number)
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0)
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)
        const slotTime24 = convertTo24Hour(newSlotTime)

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

            if (!slots_booked[newSlotDate]) {
                slots_booked[newSlotDate] = []
            }
            if (!slots_booked[newSlotDate].includes(newSlotTime)) {
                slots_booked[newSlotDate].push(newSlotTime)
            }
        } else {
            // checking for slot availability
            if (slots_booked[newSlotDate]?.includes(newSlotTime)) {
                return res.json({ success: false, message: 'Doctor Not Available' })
            }
            if (!slots_booked[newSlotDate]) {
                slots_booked[newSlotDate] = []
            }
            slots_booked[newSlotDate].push(newSlotTime)
        }

        // release the old slot
        if (slots_booked[oldSlotDate]) {
            slots_booked[oldSlotDate] = slots_booked[oldSlotDate].filter(t => t !== oldSlotTime)
            if (slots_booked[oldSlotDate].length === 0) {
                delete slots_booked[oldSlotDate]
            }
        }

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        // release the old session slot, if this appointment belonged to a session
        if (oldSessionId) {
            await sessionModel.findByIdAndUpdate(oldSessionId, {
                $pull: { appointments: appointmentData._id },
                $inc: { bookedPatientsCount: -1 }
            })
        }

        // recalculate token number for the new slot/session
        let tokenNumber
        if (matchedSession) {
            tokenNumber = matchedSession.bookedPatientsCount + 1
            matchedSession.appointments.push(appointmentData._id)
            matchedSession.bookedPatientsCount += 1
            await matchedSession.save()
        } else {
            const existingCount = await appointmentModel.countDocuments({ docId, slotDate: newSlotDate, slotTime: newSlotTime, cancelled: false })
            tokenNumber = existingCount + 1
        }

        appointmentData.slotDate = newSlotDate
        appointmentData.slotTime = newSlotTime
        appointmentData.sessionId = matchedSession ? matchedSession._id : null
        appointmentData.tokenNumber = tokenNumber
        appointmentData.reSchedule = true
        await appointmentData.save()

        try {
            // await sendSMS(appointmentData.userData.phoneNumber, `Your appointment with ${appointmentData.docData.name} has been rescheduled to ${newSlotDate.replace(/_/g, '-')} at ${newSlotTime}. Thank you!`)
            console.log(`Your appointment with ${appointmentData.docData.name} has been rescheduled to ${newSlotDate.replace(/_/g, '-')} at ${newSlotTime}. Thank you!`)
        } catch (smsError) {
            console.log('Failed to send appointment reschedule SMS:', smsError.message)
        }

        res.json({ success: true, message: 'Appointment Rescheduled' })

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

        const appointmentData = await appointmentModel.findByIdAndUpdate(order_id, { payment: true });

        try {
            // await sendSMS(appointmentData.userData.phoneNumber, `Your appointment with ${appointmentData.docData.name} is confirmed for ${appointmentData.slotDate.replace(/_/g, '-')} at ${appointmentData.slotTime}. Thank you!`)
            console.log(`Your appointment with ${appointmentData.docData.name} is confirmed for ${appointmentData.slotDate.replace(/_/g, '-')} at ${appointmentData.slotTime}. Thank you!`)
        } catch (smsError) {
            console.log('Failed to send appointment confirmation SMS:', smsError.message)
        }

        res.json({ success: true, message: "Payment Successful" })

    } catch (error) {
        console.error("PayHere Verify Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// IPN webhook PayHere calls server-to-server after a payment. This is the only place
// the real PayHere payment_id is available, which the refund API requires later.
const payhereNotify = async (req, res) => {
    try {
        const { order_id, payment_id, payhere_amount, payhere_currency, status_code, md5sig } = req.body;

        const merchant_id = process.env.PAYHERE_MERCHANT_ID;
        const merchant_secret = process.env.PAYHERE_MERCHANT_SECRET;
        const secretHash = crypto.createHash('md5').update(merchant_secret).digest('hex').toUpperCase();

        const localMd5sig = crypto.createHash('md5')
            .update(merchant_id + order_id + payhere_amount + payhere_currency + status_code + secretHash)
            .digest('hex').toUpperCase();

        if (localMd5sig !== md5sig) {
            return res.status(400).send('Invalid signature');
        }

        if (status_code === '2') {
            await appointmentModel.findByIdAndUpdate(order_id, { payment: true, payherePaymentId: payment_id });
        }

        res.status(200).send('OK');
        

    } catch (error) {
        console.error("PayHere Notify Error:", error);
        res.status(500).send('Error');
    }
};


export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment, rescheduleAppointment, paymentPayHere, verifyPayhere, payhereNotify, sendVerifyOtp, verifyEmail, isAuthenticated, sendResetOtp, resetPassword }

       