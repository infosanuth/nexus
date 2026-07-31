import mongoose from "mongoose";
import doctorModel from "../models/doctorModel.js";
import sessionModel from "../models/sessionModel.js";
import appointmentModel from "../models/appointmentModel.js";
import specialityModel from "../models/specialityModel.js";
import generateAppointmentId from "../utils/generateAppointmentId.js";
import { refundPayHerePayment, getPayHerePaymentIdByOrderId } from "../middleware/payhere.js";

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

        const doctor = await doctorModel.findById(docId).select('name')
        if (!doctor) {
            return res.json({ success: false, message: 'Doctor not found' })
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

        const session = await sessionModel.findById(sessionId).populate('appointments')

        if (!session) {
            return res.json({ success: false, message: 'Session not found' })
        }

        const appointments = session.appointments.filter(item => !item.cancelled)

        res.json({ success: true, session, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for reception to mark a session appointment as completed
const completeAppointmentReception = async (req, res) => {
    try {

        const { appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })

        if (appointmentData.payment === true) {
            await doctorModel.findByIdAndUpdate(appointmentData.docId, { $inc: { totalAppointments: 1 } })
        }

        res.json({ success: true, message: 'Appointment Completed' })

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

export {
    bookWalkInAppointment, appointmentsReception, sessionsReception, addSessionReception,
    requestRefund, requestCashRefund, cancelSessionReception,
    getSessionAppointmentsReception, completeAppointmentReception, startSessionReception, endSessionReception
}
