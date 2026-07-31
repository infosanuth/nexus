import doctorModel from "../models/doctorModel.js"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import appointmentModel from "../models/appointmentModel.js";
import sessionModel from "../models/sessionModel.js";

const changeAvailability = async (req, res) => {
    try {
        const { docId } = req.body

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
        res.json({ success: true, message: 'Availabilty Changed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const SCORE_WEIGHT_POPULARITY = 0.40
const SCORE_WEIGHT_RELIABILITY = 0.35
const SCORE_WEIGHT_EXPERIENCE = 0.25

const CANCEL_RATE_PRIOR_CANCELLED = 1
const CANCEL_RATE_PRIOR_TOTAL = 5

const doctorList = async (req, res) => {
    try {
        const doctors = await doctorModel.find({ available: true }).select(['-password', '-email']).lean()

        const normalize = (value, min, max) => (max === min ? 1 : (value - min) / (max - min))

        const specialityGroups = {}
        doctors.forEach(doc => {
            if (!specialityGroups[doc.speciality]) specialityGroups[doc.speciality] = []
            specialityGroups[doc.speciality].push(doc)
        })

        const scoreById = new Map()

        Object.values(specialityGroups).forEach(group => {
            const experienceYears = group.map(doc => parseInt(doc.experience, 10) || 0)
            const appointmentCounts = group.map(doc => doc.totalAppointments || 0)

            const minAppointments = Math.min(...appointmentCounts)
            const maxAppointments = Math.max(...appointmentCounts)
            const minExperience = Math.min(...experienceYears)
            const maxExperience = Math.max(...experienceYears)

            group.forEach((doc, i) => {
                const totalAppointments = doc.totalAppointments || 0
                const cancelAppointments = doc.cancelAppointments || 0

                const popularityScore = normalize(totalAppointments, minAppointments, maxAppointments)

                const cancellationRate = (cancelAppointments + CANCEL_RATE_PRIOR_CANCELLED) /
                    (totalAppointments + cancelAppointments + CANCEL_RATE_PRIOR_TOTAL)
                const reliabilityScore = 1 - cancellationRate

                const experienceScore = normalize(experienceYears[i], minExperience, maxExperience)

                const score = SCORE_WEIGHT_POPULARITY * popularityScore +
                    SCORE_WEIGHT_RELIABILITY * reliabilityScore +
                    SCORE_WEIGHT_EXPERIENCE * experienceScore

                scoreById.set(doc._id.toString(), score)
            })
        })

        doctors.sort((a, b) => scoreById.get(b._id.toString()) - scoreById.get(a._id.toString()))

        res.json({ success: true, doctors })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const appointmentsDoctor = async (req, res) => {
    try {
        const { docId } = req.body

        const appointments = await appointmentModel.find({ docId })
        res.json({ success: true, appointments })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
    try {

        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })

            if (appointmentData.payment === true) {
                await doctorModel.findByIdAndUpdate(docId, { $inc: { totalAppointments: 1 } })
            }

            return res.json({ success: true, message: 'Appointment Completed' })
        }

        res.json({ success: false, message: 'Mark failed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
    try {

        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

            // releasing session slot, if this appointment belonged to a session
            if (appointmentData.sessionId) {
                await sessionModel.findByIdAndUpdate(appointmentData.sessionId, {
                    $pull: { appointments: appointmentData._id },
                    $inc: { bookedPatientsCount: -1 }
                })
            }

            if (appointmentData.payment === true) {
                await doctorModel.findByIdAndUpdate(docId, { $inc: { cancelAppointments: 1 } })
            }

            return res.json({ success: true, message: 'Appointment Cancelled' })
        }

        res.json({ success: false, message: 'Cancellation failed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to get no-show appointments for doctor panel
// A no-show is a paid appointment in a session that has started and ended,
// but was never marked completed (patient never came in)
const getNoShows = async (req, res) => {
    try {

        const { docId } = req.body

        const appointments = await appointmentModel.find({
            docId,
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

// API to get dashboard data for doctor panel, scoped to the current month
const doctorDashboard = async (req, res) => {
    try {

        const { docId } = req.body

        const now = new Date()
        const currentYear = now.getFullYear()
        const currentMonth = now.getMonth() + 1 // slotDate months are 1-based

        const appointments = await appointmentModel.find({ docId })

        const thisMonthAppointments = appointments.filter((item) => {
            const [, month, year] = item.slotDate.split('_').map(Number)
            return year === currentYear && month === currentMonth
        })

        const totalAppointmentsThisMonth = thisMonthAppointments.length
        const completedAppointmentsThisMonth = thisMonthAppointments.filter((item) => item.isCompleted).length
        const cancelledAppointmentsThisMonth = thisMonthAppointments.filter((item) => item.cancelled).length
        const upcomingAppointmentsThisMonth = thisMonthAppointments.filter((item) => !item.cancelled && !item.isCompleted).length
        const rescheduledAppointmentsThisMonth = thisMonthAppointments.filter((item) => item.reSchedule && item.previousSlotDate).length

        // Earnings only count appointments that were both paid and actually completed,
        // and only the doctor's own fee (not the hospital/speciality channeling fee bundled into `amount`)
        const earningsThisMonth = thisMonthAppointments
            .filter((item) => item.payment && item.isCompleted)
            .reduce((sum, item) => sum + item.docData.fees, 0)

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

        const sessions = await sessionModel.find({ doctorId: docId, date: { $gte: startOfMonth, $lt: startOfNextMonth } })

        const sessionsThisMonth = sessions.length
        const completedSessionsThisMonth = sessions.filter((s) => s.sessionEnd).length
        const upcomingSessionsThisMonth = sessions.filter((s) => s.status === 'active' && !s.sessionStart).length
        const cancelledSessionsThisMonth = sessions.filter((s) => s.status === 'cancelled').length

        const dashData = {
            totalAppointmentsThisMonth,
            completedAppointmentsThisMonth,
            upcomingAppointmentsThisMonth,
            cancelledAppointmentsThisMonth,
            rescheduledAppointmentsThisMonth,

            sessionsThisMonth,
            completedSessionsThisMonth,
            upcomingSessionsThisMonth,
            cancelledSessionsThisMonth,

            earningsThisMonth
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


// API to get doctor profile for  Doctor Panel
const doctorProfile = async (req, res) => {
    try {

        const { docId } = req.body
        const profileData = await doctorModel.findById(docId).select('-password')

        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor profile data from  Doctor Panel
const updateDoctorProfile = async (req, res) => {
    try {

        const { docId, name, email, experience, governmentHospital, address, about, available } = req.body

        const updateData = {
            name,
            email,
            experience,
            governmentHospital: governmentHospital || '',
            address: JSON.parse(address),
            about,
            available
        }

        if (req.file) {
            updateData.image = `/uploads/${req.file.filename}`
        }

        await doctorModel.findByIdAndUpdate(docId, updateData)

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


// API for doctor to add a session for themself
const addSession = async (req, res) => {
    try {

        const { docId, date, startTime, endTime, maxPatients } = req.body

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

// API for doctor to get sessions, with per-session earnings summed from paid & completed appointments only
// (doctor's own fee only, not the hospital/speciality channeling fee bundled into `amount`)
const getSessions = async (req, res) => {
    try {

        const { docId } = req.body

        const sessions = await sessionModel.find({ doctorId: docId }).sort({ date: 1, startTime: 1 }).populate('appointments')

        const sessionsWithEarnings = sessions.map(session => {
            const { appointments, ...sessionObj } = session.toObject()
            const earnings = appointments
                .filter(appt => appt.payment && appt.isCompleted)
                .reduce((sum, appt) => sum + appt.docData.fees, 0)

            return { ...sessionObj, appointments, earnings }
        })

        res.json({ success: true, sessions: sessionsWithEarnings })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for doctor to get a single session's booked appointments
const getSessionAppointments = async (req, res) => {
    try {

        const { docId } = req.body
        const { sessionId } = req.params

        const session = await sessionModel.findById(sessionId).populate('appointments')

        if (!session) {
            return res.json({ success: false, message: 'Session not found' })
        }

        if (session.doctorId.toString() !== docId) {
            return res.json({ success: false, message: 'Not Authorized' })
        }

        const appointments = session.appointments.filter(item => !item.cancelled)

        res.json({ success: true, session, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for doctor to cancel a session (kept in the database, marked cancelled).
// Any appointments still booked into the session are cancelled along with it, and
// paid ones count against the doctor's reliability score (see cancellationRate in doctorList).
const cancelSession = async (req, res) => {
    try {

        const { docId, sessionId } = req.body

        const session = await sessionModel.findById(sessionId)

        if (!session) {
            return res.json({ success: false, message: 'Session not found' })
        }

        if (session.doctorId.toString() !== docId) {
            return res.json({ success: false, message: 'Not Authorized' })
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
                await doctorModel.findByIdAndUpdate(docId, { $inc: { cancelAppointments: paidCount } })
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

// API for doctor to mark a session as started
const startSession = async (req, res) => {
    try {

        const { docId, sessionId } = req.body

        const session = await sessionModel.findById(sessionId)

        if (!session) {
            return res.json({ success: false, message: 'Session not found' })
        }

        if (session.doctorId.toString() !== docId) {
            return res.json({ success: false, message: 'Not Authorized' })
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

// API for doctor to mark a session as ended
const endSession = async (req, res) => {
    try {

        const { docId, sessionId } = req.body

        const session = await sessionModel.findById(sessionId)

        if (!session) {
            return res.json({ success: false, message: 'Session not found' })
        }

        if (session.doctorId.toString() !== docId) {
            return res.json({ success: false, message: 'Not Authorized' })
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

// API to get a doctor's available sessions for patient booking
const getAvailableSessions = async (req, res) => {
    try {

        const { docId } = req.params

        const todayStr = new Date().toLocaleDateString('en-CA')

        const sessions = await sessionModel.find({
            doctorId: docId,
            status: 'active',
            date: { $gte: new Date(todayStr) }
        }).sort({ date: 1, startTime: 1 })

        res.json({ success: true, sessions })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { changeAvailability, doctorList, appointmentsDoctor, appointmentComplete, appointmentCancel, getNoShows, doctorDashboard, doctorProfile, updateDoctorProfile, addSession, getSessions, getSessionAppointments, cancelSession, startSession, endSession, getAvailableSessions }
