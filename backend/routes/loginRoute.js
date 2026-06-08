import express from 'express'
import { loginHandler } from '../controllers/loginController.js'

const loginRouter = express.Router()

loginRouter.post('/login', loginHandler)

export default loginRouter
