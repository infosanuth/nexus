import { createContext, useState } from "react";
import axios from 'axios'
import { toast } from 'react-toastify'

export const ReceptionContext = createContext()

const ReceptionContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [rToken, setRToken] = useState(localStorage.getItem('rToken') ? localStorage.getItem('rToken') : '')
    const [appointments, setAppointments] = useState([])
    const [sessions, setSessions] = useState([])

    // Function to get all appointments for reception
    const getAppointments = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/reception/appointments', { headers: { rToken } })

            if (data.success) {
                setAppointments(data.appointments)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Function to book a walk-in appointment for reception
    const bookWalkInAppointment = async (appointmentData) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/reception/book-appointment', appointmentData, { headers: { rToken } })

            if (data.success) {
                toast.success(data.message)
                return true
            } else {
                toast.error(data.message)
                return false
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
            return false
        }
    }

    // Function to get all doctor sessions
    const getSessions = async () => {
        try {

            const { data } = await axios.get(backendUrl + '/api/reception/sessions', { headers: { rToken } })

            if (data.success) {
                setSessions(data.sessions)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const value = {
        backendUrl,
        rToken, setRToken,
        appointments, setAppointments, getAppointments,
        sessions, setSessions, getSessions,
        bookWalkInAppointment,
    }

    return (
        <ReceptionContext.Provider value={value}>
            {props.children}
        </ReceptionContext.Provider>
    )

}

export default ReceptionContextProvider