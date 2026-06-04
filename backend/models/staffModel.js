import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role:     { type: String, enum: ['admin', 'receptionist'], required: true },
    isActive: { type: Boolean, default: true }
})

const staffModel = mongoose.model.staff || mongoose.model('staff', staffSchema)

export default staffModel
