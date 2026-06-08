import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import doctorModel from '../models/doctorModel.js'
import staffModel from '../models/staffModel.js'

// Unified login for all roles: admin, receptionist, doctor
// Returns { success, token, role } — frontend routes based on role
const loginHandler = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.json({ success: false, message: 'Email and password are required' })
        }

        // 1. Check Staff table (covers both 'admin' and 'receptionist' roles)
        const staffUser = await staffModel.findOne({ email })
        if (staffUser) {
            const isMatch = await bcrypt.compare(password, staffUser.password)
            if (!isMatch) {
                return res.json({ success: false, message: 'Invalid credentials' })
            }
            const token = jwt.sign(
                { id: staffUser._id, role: staffUser.role },
                process.env.JWT_SECRET
            )
            return res.json({ success: true, token, role: staffUser.role })
        }

        // 2. Check Doctor table
        const doctor = await doctorModel.findOne({ email })
        if (doctor) {
            const isMatch = await bcrypt.compare(password, doctor.password)
            if (!isMatch) {
                return res.json({ success: false, message: 'Invalid credentials' })
            }
            const token = jwt.sign(
                { id: doctor._id, role: 'doctor' },
                process.env.JWT_SECRET
            )
            return res.json({ success: true, token, role: 'doctor' })
        }

        // 3. Fallback: superadmin stored in env vars
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(
                { id: 'superadmin', role: 'admin' },
                process.env.JWT_SECRET
            )
            return res.json({ success: true, token, role: 'admin' })
        }

        return res.json({ success: false, message: 'Invalid credentials' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { loginHandler }
