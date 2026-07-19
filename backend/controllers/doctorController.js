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
        const doctors = await doctorModel.find({}).select(['-password', '-email']).lean()

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

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
    try {

        const { docId } = req.body

        const appointments = await appointmentModel.find({ docId })

        let earnings = 0

        appointments.map((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount
            }
        })

        let patients = []

        appointments.map((item) => {
            if (!patients.includes(item.userId)) {
                patients.push(item.userId)
            }
        })

        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: appointments.reverse().slice(0, 5)
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

// API for doctor to get sessions
const getSessions = async (req, res) => {
    try {

        const { docId } = req.body

        const sessions = await sessionModel.find({ doctorId: docId }).sort({ date: 1, startTime: 1 })

        res.json({ success: true, sessions })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for doctor to delete an empty session
const deleteSession = async (req, res) => {
    try {

        const { docId, sessionId } = req.body

        const session = await sessionModel.findById(sessionId)

        if (!session) {
            return res.json({ success: false, message: 'Session not found' })
        }

        if (session.doctorId.toString() !== docId) {
            return res.json({ success: false, message: 'Not Authorized' })
        }

        if (session.bookedPatientsCount > 0 || session.appointments.length > 0) {
            return res.json({ success: false, message: 'Cannot delete a session with booked patients' })
        }

        await sessionModel.findByIdAndDelete(sessionId)

        res.json({ success: true, message: 'Session Deleted' })

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

export { changeAvailability, doctorList, appointmentsDoctor, appointmentComplete, appointmentCancel, doctorDashboard, doctorProfile, updateDoctorProfile, addSession, getSessions, deleteSession, getAvailableSessions }
