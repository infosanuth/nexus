import express from 'express'
import { doctorList, appointmentsDoctor, appointmentComplete, appointmentCancel, doctorDashboard, doctorProfile, updateDoctorProfile, addSession, getSessions, deleteSession, getAvailableSessions } from '../controllers/doctorController.js'
import authDoctor from '../middleware/authDoctor.js'
import upload from '../middleware/multer.js'

const doctorRoutre = express.Router()

doctorRoutre.get('/list', doctorList)
doctorRoutre.get('/sessions/:docId', getAvailableSessions)
doctorRoutre.get('/appointments', authDoctor, appointmentsDoctor)
doctorRoutre.post('/complete-appointment', authDoctor, appointmentComplete)
doctorRoutre.post('/cancel-appointment', authDoctor, appointmentCancel)
doctorRoutre.get('/dashboard', authDoctor, doctorDashboard)
doctorRoutre.get('/profile', authDoctor, doctorProfile)
doctorRoutre.post('/update-profile', authDoctor, upload.single('image'), updateDoctorProfile)
doctorRoutre.post('/add-session', authDoctor, addSession)
doctorRoutre.get('/sessions', authDoctor, getSessions)
doctorRoutre.post('/delete-session', authDoctor, deleteSession)

export default doctorRoutre