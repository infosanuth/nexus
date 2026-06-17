import express from 'express'
import { bookWalkInAppointment, appointmentsReception, sessionsReception, addSessionReception } from '../controllers/receptionController.js'
import authReception from '../middleware/authReception.js'

const receptionRouter = express.Router()

receptionRouter.post('/book-appointment', authReception, bookWalkInAppointment)
receptionRouter.get('/appointments', authReception, appointmentsReception)
receptionRouter.get('/sessions', authReception, sessionsReception)
receptionRouter.post('/add-session', authReception, addSessionReception)

export default receptionRouter
