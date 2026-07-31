import express from 'express'
import {
    bookWalkInAppointment, appointmentsReception, sessionsReception, addSessionReception,
    requestRefund, requestCashRefund, cancelSessionReception,
    getSessionAppointmentsReception, completeAppointmentReception, startSessionReception, endSessionReception,
    getMyProfileReception, updateMyProfileReception, changeMyPasswordReception,
    getNoShowsReception
} from '../controllers/receptionController.js'
import authReception from '../middleware/authReception.js'

const receptionRouter = express.Router()

receptionRouter.post('/book-appointment', authReception, bookWalkInAppointment)
receptionRouter.get('/appointments', authReception, appointmentsReception)
receptionRouter.get('/no-shows', authReception, getNoShowsReception)
receptionRouter.get('/sessions', authReception, sessionsReception)
receptionRouter.post('/add-session', authReception, addSessionReception)
receptionRouter.post('/cancel-session', authReception, cancelSessionReception)
receptionRouter.get('/session-appointments/:sessionId', authReception, getSessionAppointmentsReception)
receptionRouter.post('/complete-appointment', authReception, completeAppointmentReception)
receptionRouter.post('/start-session', authReception, startSessionReception)
receptionRouter.post('/end-session', authReception, endSessionReception)
receptionRouter.post('/request-refund', authReception, requestRefund)
receptionRouter.post('/request-cash-refund', authReception, requestCashRefund)
receptionRouter.get('/my-profile', authReception, getMyProfileReception)
receptionRouter.put('/update-my-profile', authReception, updateMyProfileReception)
receptionRouter.post('/change-password', authReception, changeMyPasswordReception)

export default receptionRouter
