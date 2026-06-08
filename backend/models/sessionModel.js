import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true, },
    doctorName: { type: String, required: true },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String },
    maxPatients: { type: Number, required: true },
    bookedPatientsCount: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "cancelled"], default: "active" },
    appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: "appointment", },],
},
    { timestamps: true }
);

const sessionModel = mongoose.models.session || mongoose.model("session", sessionSchema);
export default sessionModel;
