import { createContext, useState } from "react";
import axios from 'axios'
import { toast } from 'react-toastify'

export const ReceptionContext = createContext()

const ReceptionContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [rToken, setRToken] = useState(localStorage.getItem('rToken') ? localStorage.getItem('rToken') : '')

    // Function to book a walk-in appointment for reception using API
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

    const value = {
        backendUrl,
        rToken, setRToken,
        bookWalkInAppointment,
    }

    return (
        <ReceptionContext.Provider value={value}>
            {props.children}
        </ReceptionContext.Provider>
    )

}

export default ReceptionContextProvider