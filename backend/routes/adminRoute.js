import express from "express";
import { addDoctor, allDoctors, appointmentsAdmin, appointmentCancel, sessionsAdmin, adminDashboard, getMonthlyRevenue, getAppointmentsBySpecialty, getAppointmentsByChannel, addSpeciality, getSpecialities, editSpeciality, addStaff, getStaff, deleteStaff, updateStaff, getDoctorById, updateDoctorById, getMyProfile, updateMyProfile, changeMyPassword } from "../controllers/adminController.js";
import upload from "../middleware/multer.js";
import authAdmin from "../middleware/authAdmin.js";
import { changeAvailability } from "../controllers/doctorController.js";

const adminRouter = express.Router()

adminRouter.post('/add-doctor', authAdmin, upload.single('image'), addDoctor)
adminRouter.post('/all-doctors', authAdmin, allDoctors)
adminRouter.post('/change-availability', authAdmin, changeAvailability)
adminRouter.get('/appointments', authAdmin, appointmentsAdmin)
adminRouter.post('/cancel-appointment', authAdmin, appointmentCancel)
adminRouter.get('/sessions', authAdmin, sessionsAdmin)
adminRouter.get('/dashboard', authAdmin, adminDashboard)
adminRouter.get('/monthly-revenue', authAdmin, getMonthlyRevenue);
adminRouter.get('/specialty-count',authAdmin, getAppointmentsBySpecialty)
adminRouter.get('/channel-count', authAdmin, getAppointmentsByChannel)
adminRouter.post('/appointments-doctor',authAdmin,)
adminRouter.post('/add-staff', authAdmin, addStaff)
adminRouter.get('/staff', authAdmin, getStaff)
adminRouter.delete('/delete-staff/:id', authAdmin, deleteStaff)
adminRouter.put('/update-staff/:id', authAdmin, updateStaff)
adminRouter.post('/add-speciality', authAdmin, upload.single('image'), addSpeciality)
adminRouter.put('/update-speciality/:id', authAdmin, upload.single('image'), editSpeciality)
adminRouter.get('/specialities', getSpecialities)
adminRouter.get('/doctor/:id', authAdmin, getDoctorById)
adminRouter.put('/update-doctor/:id', authAdmin, upload.single('image'), updateDoctorById)
adminRouter.get('/my-profile', authAdmin, getMyProfile)
adminRouter.put('/update-my-profile', authAdmin, updateMyProfile)
adminRouter.post('/change-password', authAdmin, changeMyPassword)


export default adminRouter  
