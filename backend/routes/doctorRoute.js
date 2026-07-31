import express from 'express'
import { doctorList, appointmentsDoctor, appointmentComplete, appointmentCancel, getNoShows, doctorDashboard, doctorProfile, updateDoctorProfile, addSession, getSessions, getSessionAppointments, cancelSession, startSession, endSession, getAvailableSessions } from '../controllers/doctorController.js'
import authDoctor from '../middleware/authDoctor.js'
import upload from '../middleware/multer.js'

const doctorRoutre = express.Router()

doctorRoutre.get('/list', doctorList)
doctorRoutre.get('/sessions/:docId', getAvailableSessions)
doctorRoutre.get('/appointments', authDoctor, appointmentsDoctor)
doctorRoutre.post('/complete-appointment', authDoctor, appointmentComplete)
doctorRoutre.post('/cancel-appointment', authDoctor, appointmentCancel)
doctorRoutre.get('/no-shows', authDoctor, getNoShows)
doctorRoutre.get('/dashboard', authDoctor, doctorDashboard)
doctorRoutre.get('/profile', authDoctor, doctorProfile)
doctorRoutre.post('/update-profile', upload.single('image'), authDoctor, updateDoctorProfile)
doctorRoutre.post('/add-session', authDoctor, addSession)
doctorRoutre.get('/sessions', authDoctor, getSessions)
doctorRoutre.get('/session-appointments/:sessionId', authDoctor, getSessionAppointments)
doctorRoutre.post('/cancel-session', authDoctor, cancelSession)
doctorRoutre.post('/start-session', authDoctor, startSession)
doctorRoutre.post('/end-session', authDoctor, endSession)

export default doctorRoutre