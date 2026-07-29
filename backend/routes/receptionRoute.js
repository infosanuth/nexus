import express from 'express'
import { bookWalkInAppointment, appointmentsReception, sessionsReception, addSessionReception, requestRefund, requestCashRefund, cancelSessionReception } from '../controllers/receptionController.js'
import authReception from '../middleware/authReception.js'

const receptionRouter = express.Router()

receptionRouter.post('/book-appointment', authReception, bookWalkInAppointment)
receptionRouter.get('/appointments', authReception, appointmentsReception)
receptionRouter.get('/sessions', authReception, sessionsReception)
receptionRouter.post('/add-session', authReception, addSessionReception)
receptionRouter.post('/cancel-session', authReception, cancelSessionReception)
receptionRouter.post('/request-refund', authReception, requestRefund)
receptionRouter.post('/request-cash-refund', authReception, requestCashRefund)

export default receptionRouter
