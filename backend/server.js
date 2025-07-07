import express from 'express'
import cors from 'cors'
import path from 'path'
import 'dotenv/config'
import connectDB from './config/mongodb.js'

import adminRouter from './routes/adminRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import userRouter from './routes/userRoute.js'

// app config
const app = express()
const port = process.env.PORT || 4000
connectDB()

// middlewares
app.use(express.json())
app.use(cors())

// api endpoint
app.use('/api/admin', adminRouter)
app.use('/api/doctor',doctorRouter)
app.use('/api/user',userRouter)
app.use('/uploads', express.static('uploads'));
// app.use('/uploads', express.static(path.join(path.resolve(), 'uploads')))



app.get('/', (req, res) => {
    res.send('API WORKING sanuth')
})

app.listen(port, () => console.log("Server started", port))