import appointmentModel from "../models/appointmentModel.js"

// Generates a random 8-digit appointment ID, unique among existing appointments
const generateAppointmentId = async () => {
    let ref
    let exists = true
    while (exists) {
        ref = Math.floor(10000000 + Math.random() * 90000000)
        exists = await appointmentModel.exists({ ref })
    }
    return ref
}

export default generateAppointmentId
