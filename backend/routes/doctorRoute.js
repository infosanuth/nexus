import express from 'express'
import { doctorList, loginDoctor, appointmentsDoctor } from '../controllers/doctorController.js'
import authDoctor from '../middleware/authDoctor.js'

const doctorRoutre = express.Router()

doctorRoutre.get('/list',doctorList)
doctorRoutre.post('/login',loginDoctor)
doctorRoutre.get('/appointments',authDoctor,appointmentsDoctor)

export default doctorRoutre