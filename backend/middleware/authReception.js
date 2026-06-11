import jwt from 'jsonwebtoken'

// Reception authentication middleware
const authReception = async (req, res, next) => {
    try {
        const { rtoken } = req.headers
        if (!rtoken) {
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }

        const decoded = jwt.verify(rtoken, process.env.JWT_SECRET)

        if (decoded.role !== 'receptionist') {
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }

        req.body.staffId = decoded.id
        next()

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export default authReception
