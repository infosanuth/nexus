import express from 'express'
import { doctorList, loginDoctor } from '../controllers/doctorController.js'

const doctorRoutre = express.Router()

doctorRoutre.get('/list',doctorList)
doctorRoutre.post('/login',loginDoctor)

export default doctorRoutre