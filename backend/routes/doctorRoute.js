import express from 'express'
import { doctorList, loginDoctor, appointmentsDoctor, appointmentComplete, appointmentCancel, doctorDashboard, doctorProfile, updateDoctorProfile } from '../controllers/doctorController.js'
import authDoctor from '../middleware/authDoctor.js'

const doctorRoutre = express.Router()

doctorRoutre.get('/list', doctorList)
doctorRoutre.post('/login', loginDoctor)
doctorRoutre.get('/appointments', authDoctor, appointmentsDoctor)
doctorRoutre.post('/complete-appointment', authDoctor, appointmentComplete)
doctorRoutre.post('/cancel-appointment', authDoctor, appointmentCancel)
doctorRoutre.get('/dashboard', authDoctor, doctorDashboard)
doctorRoutre.get('/profile', authDoctor, doctorProfile)
doctorRoutre.post('/update-profile', authDoctor, updateDoctorProfile)

export default doctorRoutre