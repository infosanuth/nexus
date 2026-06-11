import express from 'express'
import { bookWalkInAppointment } from '../controllers/receptionController.js'
import authReception from '../middleware/authReception.js'

const receptionRouter = express.Router()

receptionRouter.post('/book-appointment', authReception, bookWalkInAppointment)

export default receptionRouter
