import jwt from 'jsonwebtoken'

// admin authentication middleware
const authAdmin = async (req,res,next) => {
    try{

        const {atoken} = req.headers
        if (!atoken){
            return res.json({success:false,message:'Not Authorized Login Again'})
        }
        const token_decode = jwt.verify(atoken,process.env.JWT_SECRET)

        if(token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD){
            return res.json({success:false,message:'Not Authorized Login Again'})
        }

        next()

    }catch(error){
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export default authAdmin

// import jwt from 'jsonwebtoken'

// // admin authentication middleware
// const authAdmin = async (req, res, next) => {
//   try {
//     const { atoken } = req.headers

//     if (!atoken) {
//       return res.json({ success: false, message: 'Not Authorized. Login Again' })
//     }

//     const decoded = jwt.verify(atoken, process.env.JWT_SECRET)
//     const adminUsers = JSON.parse(process.env.ADMIN_USERS)

//     // Check if decoded token matches any email+password combo
//     const isValid = adminUsers.some(
//       (admin) => decoded === admin.email + admin.password
//     )

//     if (!isValid) {
//       return res.json({ success: false, message: 'Not Authorized. Login Again' })
//     }

//     next()
//   } catch (error) {
//     console.error(error)
//     res.json({ success: false, message: 'Token verification failed' })
//   }
// }

// export default authAdmin
