import express from 'express'
import { doctorList } from '../controllers/doctorController.js'

const doctorRoutre = express.Router()

doctorRoutre.get('/list',doctorList)

export default doctorRoutre