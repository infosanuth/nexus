import validator from "validator"
import bycrypt from 'bcrypt'
import doctorModel from "../models/doctorModel.js"
import appointmentModel from "../models/appointmentModel.js";
import jwt from 'jsonwebtoken'
import userModel from "../models/userModel.js";

// API for adding doctor
const addDoctor = async (req, res) => {

    try {

        const { name, email, password, speciality, degree, experience, about, fees, address } = req.body
        const imageFile = req.file

        // console.log({ name, email, password, speciality, degree, experience, about, fees, address },imageFile);

        // Checking for all data to add doctor
        if (!name || !email || !password || !speciality || !degree || !experience || !about) {
            return res.json({ success: false, message: "Missing Details" })
        }

        // Validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a vaild email" })
        }

        // Validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // Hashign doctor password
        const salt = await bycrypt.genSalt(10)
        const hashedPassword = await bycrypt.hash(password, salt)

        // let imageUrl = "";   initialize variable
        // Use local image path (uploaded by multer)
        const imagePath = `/uploads/${req.file.filename}` // e.g., "uploads/1710000000-dr.jpg"

        //  Upload image to cloudinary
        // const imageUpoad = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
        // const imageUrl = imageUpoad.secure_url

        const doctorData = {
            name,
            email,
            image: imagePath,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            address: JSON.parse(address),
            date: Date.now()
        }

        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()

        res.json({ success: true, message: "Doctor Added" })


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for admin login
const loginAdmin = async (req, res) => {
    try {
        const {email, password} = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
            
            const token = jwt.sign(email+password, process.env.JWT_SECRET)
            res.json({success:true,token})

        } else{
            res.json({success:false,message:"Invalid credentials"})
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all doctors list for admin panel
const allDoctors = async (req,res) =>{
    try {
        const doctors = await doctorModel.find({}).select('-password')
        res.json({success:true,doctors})
        
    } catch (error) {
         console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
    try {

        const appointments = await appointmentModel.find({})
        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}
// API for appointment cancellation
const appointmentCancel = async (req, res) => {
    try {

        const { appointmentId } = req.body
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
    try {

        const doctors = await doctorModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({})

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            latestAppointments: appointments.reverse().slice(0,5)
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


export { addDoctor, loginAdmin, allDoctors, appointmentsAdmin, appointmentCancel ,adminDashboard } 