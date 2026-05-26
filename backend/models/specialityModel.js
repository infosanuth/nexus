import mongoose from "mongoose";

const specialitySchema = new mongoose.Schema({
    speciality: { type: String, required: true, unique: true },
    image: { type: String, required: true },
    channelingFee: { type: Number, required: true }
})

const specialityModel = mongoose.model.speciality || mongoose.model('speciality', specialitySchema)

export default specialityModel
