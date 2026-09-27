import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import doctorModel from "../models/doctorModel.js";
import sessionModel from "../models/sessionModel.js";
import appointmentModel from "../models/appointmentModel.js";
import specialityModel from "../models/specialityModel.js";
import staffModel from "../models/staffModel.js";
import generateAppointmentId from "../utils/generateAppointmentId.js";
import { refundPayHerePayment, getPayHerePaymentIdByOrderId } from "../middleware/payhere.js";
import { sendSMS } from "../config/twilio.js";

// Helper to convert a 24-hour "HH:MM" session start time to a 12-hour "h:mm AM/PM" slot time
const convertTo12Hour = (time24) => {
    let [hours, minutes] = time24.split(':').map(Number)
    const modifier = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12 || 12
    return `${hours}:${String(minutes).padStart(2, '0')} ${modifier}`
}

// API for reception to book an appointment for a walk-in patient
const bookWalkInAppointment = async (req, res) => {
    try {

        const { docId, sessionId, patientDetails, payment } = req.body

        if (!docId || !sessionId || !patientDetails) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        const { name, age, gender, phoneNumber } = patientDetails

        if (!name || !phoneNumber) {
            return res.json({ success: false, message: 'Patient name and phone number are required' })
        }

        const docData = await doctorModel.findById(docId).select("-password")
        if (!docData) {
            return res.json({ success: false, message: 'Doctor not found' })
        }
        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor Not Available' })
        }

        const session = await sessionModel.findById(sessionId)
        if (!session || session.doctorId.toString() !== docId) {
            return res.json({ success: false, message: 'Session not found for selected doctor' })
        }
        if (session.status !== 'active') {
            return res.json({ success: false, message: 'Session is not active' })
        }
        if (session.bookedPatientsCount >= session.maxPatients) {
            return res.json({ success: false, message: 'Session is fully booked' })
        }

        // Build slot date/time in the same format used for online bookings
        const sessionDate = new Date(session.date)
        const slotDate = `${sessionDate.getDate()}_${sessionDate.getMonth() + 1}_${sessionDate.getFullYear()}`
        const slotTime = convertTo12Hour(session.startTime)

        let slots_booked = docData.slots_booked
        if (!slots_booked[slotDate]) {
            slots_booked[slotDate] = []
        }
        if (!slots_booked[slotDate].includes(slotTime)) {
            slots_booked[slotDate].push(slotTime)
        }

        const docDataObj = docData.toObject()
        delete docDataObj.slots_booked

        const hospitalCharge = (await specialityModel.findOne({ speciality: docData.speciality }))?.channelingFee ?? 0

        // Calculate token number for this session, consistent with online bookings
        const tokenNumber = session.bookedPatientsCount + 1

        const appointmentData = {
            ref: await generateAppointmentId(),
            userId: `walkin-${new mongoose.Types.ObjectId()}`,
            docId,
            slotDate,
            slotTime,
            userData: {
                name,
                age: age || '',
                gender: gender || 'Not Selected',
                phoneNumber,
                isWalkIn: true
            },
            docData: docDataObj,
            amount: docData.fees + hospitalCharge,
            date: Date.now(),
            tokenNumber,
            payment: payment === true,
            isWalkIn: true,
            sessionId: session._id
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        session.appointments.push(newAppointment._id)
        session.bookedPatientsCount += 1
        await session.save()

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        try {
            // await sendSMS(phoneNumber, `Your appointment with ${docData.name} has been booked. Token No: ${tokenNumber}, ${slotDate.replace(/_/g, '-')} at ${slotTime}. Thank you!`)
            console.log(`Your appointment with ${docData.name} has been booked. Token No: ${tokenNumber}, ${slotDate.replace(/_/g, '-')} at ${slotTime}. Thank you!`)
        } catch (smsError) {
            console.log('Failed to send walk-in booking SMS:', smsError.message)
        }

        res.json({ success: true, message: 'Appointment booked successfully', appointment: newAppointment })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for reception to get all appointments
const appointmentsReception = async (req, res) => {
    try {

        const appointments = await appointmentModel.find({})
        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for reception to get no-show appointments across all doctors
// A no-show is a paid appointment in a session that has started and ended,
// but was never marked completed (patient never came in)
const getNoShowsReception = async (req, res) => {
    try {

        const appointments = await appointmentModel.find({
            payment: true,
            isCompleted: false,
            cancelled: false,
            sessionId: { $ne: null }
        }).populate('sessionId')

        const noShows = appointments.filter(item => item.sessionId?.sessionStart && item.sessionId?.sessionEnd)

        res.json({ success: true, noShows })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for reception to get all doctor sessions
const sessionsReception = async (req, res) => {
    try {

        const sessions = await sessionModel.find({}).sort({ date: 1, startTime: 1 })
        res.json({ success: true, sessions })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for reception to add a session for a doctor
const addSessionReception = async (req, res) => {
    try {

        const { docId, date, startTime, endTime, maxPatients } = req.body

        if (!docId || !date || !startTime || !maxPatients) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        if (Number(maxPatients) < 10 || Number(maxPatients) > 40) {
            return res.json({ success: false, message: 'Max patients must be between 10 and 40' })
        }

        const SESSION_WINDOW_START = '07:00'
        const SESSION_WINDOW_END = '22:00'
        if (startTime < SESSION_WINDOW_START || startTime > SESSION_WINDOW_END) {
            return res.json({ success: false, message: 'Sessions can only be scheduled between 7:00 AM and 10:00 PM' })
        }
        if (endTime && (endTime < SESSION_WINDOW_START || endTime > SESSION_WINDOW_END)) {
            return res.json({ success: false, message: 'Sessions can only be scheduled between 7:00 AM and 10:00 PM' })
        }

        const now = new Date()
        const todayStr = now.toLocaleDateString('en-CA')
        if (date < todayStr) {
            return res.json({ success: false, message: 'Cannot add a session for a past date' })
        }

        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        if (date === todayStr && startTime < currentTime) {
            return res.json({ success: false, message: 'Cannot add a session for a past time' })
        }

        if (endTime && endTime <= startTime) {
            return res.json({ success: false, message: 'End time must be after start time' })
        }

        if (endTime) {
            const [startH, startM] = startTime.split(':').map(Number)
            const [endH, endM] = endTime.split(':').map(Number)
            if ((endH * 60 + endM) - (startH * 60 + startM) < 60) {
                return res.json({ success: false, message: 'Session must be at least 1 hour long' })
            }
        }

        const doctor = await doctorModel.findById(docId).select('name')
        if (!doctor) {
            return res.json({ success: false, message: 'Doctor not found' })
        }

        const existingSessionsCount = await sessionModel.countDocuments({ doctorId: docId, date, status: 'active' })
        if (existingSessionsCount >= 2) {
            return res.json({ success: false, message: 'Maximum 2 sessions per day allowed for a doctor' })
        }

        // A doctor can only have one session at a time, with a 2-hour gap required before and after it.
        // Nearby sessions on the adjacent days are checked too since the buffer can cross midnight.
        const SESSION_GAP_MINUTES = 120
        const toMinutesSinceEpoch = (dateStr, timeStr) => {
            const [year, month, day] = dateStr.split('-').map(Number)
            const [hour, minute] = timeStr.split(':').map(Number)
            return Date.UTC(year, month - 1, day, hour, minute) / 60000
        }
        const shiftDateStr = (dateStr, days) => {
            const [year, month, day] = dateStr.split('-').map(Number)
            const dt = new Date(Date.UTC(year, month - 1, day))
            dt.setUTCDate(dt.getUTCDate() + days)
            return dt.toISOString().slice(0, 10)
        }

        const newStart = toMinutesSinceEpoch(date, startTime)
        const newEnd = endTime ? toMinutesSinceEpoch(date, endTime) : newStart

        const nearbySessions = await sessionModel.find({
            doctorId: docId,
            status: 'active',
            date: { $gte: new Date(shiftDateStr(date, -1)), $lte: new Date(shiftDateStr(date, 1)) }
        })

        for (const s of nearbySessions) {
            const sDateStr = s.date.toISOString().slice(0, 10)
            const existStart = toMinutesSinceEpoch(sDateStr, s.startTime) - SESSION_GAP_MINUTES
            const existEnd = toMinutesSinceEpoch(sDateStr, s.endTime || s.startTime) + SESSION_GAP_MINUTES
            if (newStart < existEnd && newEnd > existStart) {
                return res.json({ success: false, message: `Doctor has a session on ${sDateStr} at ${s.startTime}. Sessions must be at least 2 hours apart.` })
            }
        }

        const sessionData = {
            doctorId: docId,
            doctorName: doctor.name,
            date,
            startTime,
            endTime,
            maxPatients
        }

        const newSession = new sessionModel(sessionData)
        await newSession.save()

        res.json({ success: true, message: 'Session Added' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for reception to request and process a refund for a cancelled, paid appointment
const requestRefund = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' })
        }
        if (!appointmentData.cancelled) {
            return res.json({ success: false, message: 'Only cancelled appointments can be refunded' })
        }
        if (!appointmentData.payment) {
            return res.json({ success: false, message: 'Appointment was not paid, nothing to refund' })
        }
        if (appointmentData.refundPayment) {
            return res.json({ success: false, message: 'Refund already processed for this appointment' })
        }

        if (!appointmentData.refund) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { refund: true })
        }

        try {
            // The notify webhook (which normally captures this) can't reach a local dev
            // server, so fall back to looking the payment_id up directly if it's missing.
            let payherePaymentId = appointmentData.payherePaymentId
            if (!payherePaymentId) {
                payherePaymentId = await getPayHerePaymentIdByOrderId(appointmentId)
                await appointmentModel.findByIdAndUpdate(appointmentId, { payherePaymentId })
            }

            await refundPayHerePayment(payherePaymentId, `Refund for appointment ${appointmentId}`)
            await appointmentModel.findByIdAndUpdate(appointmentId, { refundPayment: true })

            try {
                // await sendSMS(appointmentData.userData.phoneNumber, `Your refund for the appointment with ${appointmentData.docData.name} has been approved. The amount will be credited to your bank account within 24 hours.`)
                console.log(`Your refund for the appointment with ${appointmentData.docData.name} has been approved. The amount will be credited to your bank account within 24 hours.`)
            } catch (smsError) {
                console.log('Failed to send refund approval SMS:', smsError.message)
            }

            res.json({ success: true, message: 'Refund processed successfully' })
        } catch (refundError) {
            console.log(refundError)
            res.json({ success: false, message: `Refund requested, but PayHere processing failed: ${refundError.message}` })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for reception to confirm a cash refund for a cancelled, paid walk-in appointment.
// Walk-in payments are collected in cash at the desk, so there's no PayHere transaction
// to reverse — this just records that the cash was handed back.
const requestCashRefund = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' })
        }
        if (!appointmentData.isWalkIn) {
            return res.json({ success: false, message: 'This appointment is not a walk-in appointment' })
        }
        if (!appointmentData.cancelled) {
            return res.json({ success: false, message: 'Only cancelled appointments can be refunded' })
        }
        if (!appointmentData.payment) {
            return res.json({ success: false, message: 'Appointment was not paid, nothing to refund' })
        }
        if (appointmentData.refundPayment) {
            return res.json({ success: false, message: 'Refund already processed for this appointment' })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { refund: true, refundPayment: true })

        res.json({ success: true, message: 'Cash refund confirmed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for reception to cancel a session (kept in the database, marked cancelled).
// Any appointments still booked into the session are cancelled along with it, and
// paid ones count against the doctor's reliability score (see cancellationRate in doctorList).
const cancelSessionReception = async (req, res) => {
    try {

        const { sessionId } = req.body

        const session = await sessionModel.findById(sessionId)

        if (!session) {
            return res.json({ success: false, message: 'Session not found' })
        }

        if (session.status === 'cancelled') {
            return res.json({ success: false, message: 'Session already cancelled' })
        }

        const activeAppointments = await appointmentModel.find({
            _id: { $in: session.appointments },
            cancelled: false
        })

        if (activeAppointments.length > 0) {
            await appointmentModel.updateMany(
                { _id: { $in: activeAppointments.map(item => item._id) } },
                { cancelled: true }
            )

            const paidCount = activeAppointments.filter(item => item.payment === true).length
            if (paidCount > 0) {
                await doctorModel.findByIdAndUpdate(session.doctorId, { $inc: { cancelAppointments: paidCount } })
            }

            for (const appt of activeAppointments) {
                try {
                    const dateStr = appt.slotDate.replace(/_/g, '-')
                    const smsText = appt.payment
                        ? `Your appointment with ${appt.docData.name} on ${dateStr} has been cancelled. You can request a refund from the My Appointments page or contact us.`
                        : `Your appointment with ${appt.docData.name} on ${dateStr} has been cancelled.`
                    // await sendSMS(appt.userData.phoneNumber, smsText)
                    console.log(smsText)
                } catch (smsError) {
                    console.log('Failed to send session cancellation SMS:', smsError.message)
                }
            }
        }

        session.status = 'cancelled'
        await session.save()

        const message = activeAppointments.length > 0
            ? `Session cancelled along with ${activeAppointments.length} booked appointment${activeAppointments.length === 1 ? '' : 's'}`
            : 'Session Cancelled'

        res.json({ success: true, message })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for reception to get a single session's booked appointments
const getSessionAppointmentsReception = async (req, res) => {
    try {

        const { sessionId } = req.params
        const { includeCancelled } = req.query

        const session = await sessionModel.findById(sessionId).populate('appointments')

        if (!session) {
            return res.json({ success: false, message: 'Session not found' })
        }

        const appointments = includeCancelled === 'true' ? session.appointments : session.appointments.filter(item => !item.cancelled)

        res.json({ success: true, session, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for reception to toggle a session appointment's completed status
const completeAppointmentReception = async (req, res) => {
    try {

        const { appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' })
        }

        const newStatus = !appointmentData.isCompleted

        if (newStatus && appointmentData.sessionId) {
            const session = await sessionModel.findById(appointmentData.sessionId)
            if (!session?.sessionStart) {
                return res.json({ success: false, message: 'Cannot complete an appointment before the session has started' })
            }
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: newStatus })

        if (appointmentData.payment === true) {
            await doctorModel.findByIdAndUpdate(appointmentData.docId, { $inc: { totalAppointments: newStatus ? 1 : -1 } })
        }

        if (newStatus) {
            try {
                // await sendSMS(appointmentData.userData.phoneNumber, `Thank you for visiting ${appointmentData.docData.name} today. Your appointment is now complete.`)
                console.log(`Thank you for visiting ${appointmentData.docData.name} today. Your appointment is now complete.`)
            } catch (smsError) {
                console.log('Failed to send appointment completion SMS:', smsError.message)
            }
        }

        res.json({ success: true, message: newStatus ? 'Appointment Completed' : 'Marked as Not Completed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for reception to mark a session as started
const startSessionReception = async (req, res) => {
    try {

        const { sessionId } = req.body

        const session = await sessionModel.findById(sessionId)

        if (!session) {
            return res.json({ success: false, message: 'Session not found' })
        }

        const sessionDay = new Date(session.date)
        const [hours, minutes] = session.startTime.split(':').map(Number)
        const scheduledStart = new Date(sessionDay.getUTCFullYear(), sessionDay.getUTCMonth(), sessionDay.getUTCDate(), hours, minutes)

        const windowStart = new Date(scheduledStart.getTime() - 20 * 60 * 1000)
        const windowEnd = new Date(scheduledStart.getTime() + 60 * 60 * 1000)
        const now = new Date()

        if (now < windowStart) {
            const formatTime = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
            return res.json({ success: false, message: `Too early to start. This session opens for starting at ${formatTime(windowStart)}.` })
        }

        if (now > windowEnd) {
            const formatTime = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
            return res.json({ success: false, message: `The window to start this session has closed at ${formatTime(windowEnd)}.` })
        }

        if (session.appointments.length === 0) {
            return res.json({ success: false, message: 'Cannot start a session with no appointments booked.' })
        }

        session.sessionStart = true
        await session.save()

        const activeAppointments = await appointmentModel.find({ _id: { $in: session.appointments }, cancelled: false })
        for (const appt of activeAppointments) {
            try {
                // await sendSMS(appt.userData.phoneNumber, `${appt.docData.name} has arrived and the session has started. Please proceed to the hospital. Your token number is ${appt.tokenNumber}.`)
                console.log(`${appt.docData.name} has arrived and the session has started. Please proceed to the hospital. Your token number is ${appt.tokenNumber}.`)
            } catch (smsError) {
                console.log('Failed to send session start SMS:', smsError.message)
            }
        }

        res.json({ success: true, message: 'Session Started' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for reception to mark a session as ended
const endSessionReception = async (req, res) => {
    try {

        const { sessionId } = req.body

        const session = await sessionModel.findById(sessionId)

        if (!session) {
            return res.json({ success: false, message: 'Session not found' })
        }

        if (!session.sessionStart) {
            return res.json({ success: false, message: 'Session has not been started yet' })
        }

        session.sessionEnd = true
        await session.save()

        res.json({ success: true, message: 'Session Ended' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for the currently logged-in receptionist to fetch their own profile
const getMyProfileReception = async (req, res) => {
    try {

        const { staffId } = req.body

        const staff = await staffModel.findById(staffId).select('-password')
        if (!staff) {
            return res.json({ success: false, message: 'Account not found' })
        }

        res.json({ success: true, profile: { name: staff.name, email: staff.email } })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for the currently logged-in receptionist to update their own name
// Email is fixed (it's the login identifier) and isn't editable here
const updateMyProfileReception = async (req, res) => {
    try {

        const { staffId, name } = req.body

        if (!name) {
            return res.json({ success: false, message: 'Name is required' })
        }

        const updated = await staffModel.findByIdAndUpdate(staffId, { name }, { new: true }).select('-password')
        if (!updated) {
            return res.json({ success: false, message: 'Account not found' })
        }

        res.json({ success: true, message: 'Profile updated successfully', profile: { name: updated.name, email: updated.email } })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for the currently logged-in receptionist to change their own password
const changeMyPasswordReception = async (req, res) => {
    try {

        const { staffId, currentPassword, newPassword } = req.body

        if (!currentPassword || !newPassword) {
            return res.json({ success: false, message: 'Current and new password are required' })
        }

        if (newPassword.length < 8) {
            return res.json({ success: false, message: 'New password must be at least 8 characters' })
        }

        const staff = await staffModel.findById(staffId)
        if (!staff) {
            return res.json({ success: false, message: 'Account not found' })
        }

        const isMatch = await bcrypt.compare(currentPassword, staff.password)
        if (!isMatch) {
            return res.json({ success: false, message: 'Current password is incorrect' })
        }

        const salt = await bcrypt.genSalt(10)
        staff.password = await bcrypt.hash(newPassword, salt)
        await staff.save()

        res.json({ success: true, message: 'Password changed successfully' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export {
    bookWalkInAppointment, appointmentsReception, sessionsReception, addSessionReception,
    requestRefund, requestCashRefund, cancelSessionReception,
    getSessionAppointmentsReception, completeAppointmentReception, startSessionReception, endSessionReception,
    getMyProfileReception, updateMyProfileReception, changeMyPasswordReception,
    getNoShowsReception
}
