import jwt from 'jsonwebtoken'

const authAdmin = async (req, res, next) => {
    try {
        const { atoken } = req.headers
        if (!atoken) {
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }

        const decoded = jwt.verify(atoken, process.env.JWT_SECRET)

        if (decoded.role !== 'admin') {
            return res.json({ success: false, message: 'Not Authorized Login Again' })
        }

        req.body.adminId = decoded.id
        next()

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export default authAdmin
