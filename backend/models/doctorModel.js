import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String },
    gender: { type: String, enum: ["Male", "Female"], required: true },
    registrationNumber: { type: String, required: true, unique: true },
    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String },
    available: { type: Boolean, default:true },
    fees: { type: Number, required: true },
    address: { type: Object, required: true },
    governmentHospital: { type: String, default: "" },
    date: { type: Number, required: true },
    slots_booked: { type: Object, default: {} },
    totalAppointments: { type: Number, default: 0 },
    cancelAppointments: { type: Number, default: 0 }
}, { minimize: false })

const doctorModel = mongoose.model.doctor || mongoose.model('doctor', doctorSchema)

export default doctorModel