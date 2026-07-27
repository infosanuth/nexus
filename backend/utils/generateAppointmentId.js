import appointmentModel from "../models/appointmentModel.js"

// Generates a random 7-8 digit appointment ID, unique among existing appointments
const generateAppointmentId = async () => {
    let ref
    let exists = true
    while (exists) {
        ref = Math.floor(1000000 + Math.random() * 99000000)
        exists = await appointmentModel.exists({ ref })
    }
    return ref
}

export default generateAppointmentId
