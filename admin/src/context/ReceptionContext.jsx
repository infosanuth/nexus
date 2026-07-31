import { createContext, useState } from "react";
import axios from 'axios'
import { toast } from 'react-toastify'

export const ReceptionContext = createContext()

const ReceptionContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [rToken, setRToken] = useState(localStorage.getItem('rToken') ? localStorage.getItem('rToken') : '')
    const [rName, setRName] = useState(localStorage.getItem('rName') ? localStorage.getItem('rName') : '')
    const [myProfile, setMyProfile] = useState(false)
    const [noShows, setNoShows] = useState([])
    const [appointments, setAppointments] = useState([])
    const [sessions, setSessions] = useState([])
    const [sessionDetails, setSessionDetails] = useState(false)
    const [sessionAppointments, setSessionAppointments] = useState([])

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

    // Function to add a new session for a doctor
    const addSession = async (sessionData) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/reception/add-session', sessionData, { headers: { rToken } })

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

    // Function to request/process a refund for a cancelled, paid appointment
    const requestRefund = async (appointmentId) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/reception/request-refund', { appointmentId }, { headers: { rToken } })

            if (data.success) {
                toast.success(data.message)
                getAppointments()
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

    // Function to confirm a cash refund for a cancelled, paid walk-in appointment
    const requestCashRefund = async (appointmentId) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/reception/request-cash-refund', { appointmentId }, { headers: { rToken } })

            if (data.success) {
                toast.success(data.message)
                getAppointments()
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

    // Function to cancel a session (kept in the database, marked cancelled).
    // Any appointments still booked into it are cancelled along with it.
    const cancelSession = async (sessionId) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/reception/cancel-session', { sessionId }, { headers: { rToken } })

            if (data.success) {
                toast.success(data.message)
                getSessions()
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

    // Function to get a single session's booked appointments
    const getSessionAppointments = async (sessionId, includeCancelled = false) => {
        try {

            const { data } = await axios.get(backendUrl + '/api/reception/session-appointments/' + sessionId + (includeCancelled ? '?includeCancelled=true' : ''), { headers: { rToken } })

            if (data.success) {
                setSessionDetails(data.session)
                setSessionAppointments(data.appointments)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Function to mark an appointment within a session as completed
    const completeSessionAppointment = async (appointmentId, sessionId) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/reception/complete-appointment', { appointmentId }, { headers: { rToken } })

            if (data.success) {
                toast.success(data.message)
                getSessionAppointments(sessionId)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Function to mark a session as started
    const startSession = async (sessionId) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/reception/start-session', { sessionId }, { headers: { rToken } })

            if (data.success) {
                toast.success(data.message)
                getSessionAppointments(sessionId)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Function to mark a session as ended (only allowed once the session has started)
    const endSession = async (sessionId) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/reception/end-session', { sessionId }, { headers: { rToken } })

            if (data.success) {
                toast.success(data.message)
                getSessionAppointments(sessionId)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Function to get the currently logged-in receptionist's own profile
    const getMyProfile = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/reception/my-profile', { headers: { rToken } })
            if (data.success) {
                setMyProfile(data.profile)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Function to update the currently logged-in receptionist's own name
    const updateMyProfile = async (name) => {
        try {
            const { data } = await axios.put(backendUrl + '/api/reception/update-my-profile', { name }, { headers: { rToken } })
            if (data.success) {
                toast.success(data.message)
                setMyProfile(data.profile)
                setRName(data.profile.name)
                localStorage.setItem('rName', data.profile.name)
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

    // Function to change the currently logged-in receptionist's own password
    const changeMyPassword = async (currentPassword, newPassword) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/reception/change-password', { currentPassword, newPassword }, { headers: { rToken } })
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

    // Function to get no-show appointments across all doctors (paid, session started & ended, never completed)
    const getNoShows = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/reception/no-shows', { headers: { rToken } })
            if (data.success) {
                setNoShows(data.noShows)
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
        rName, setRName,
        myProfile, getMyProfile, updateMyProfile, changeMyPassword,
        noShows, getNoShows,
        appointments, setAppointments, getAppointments,
        sessions, setSessions, getSessions, cancelSession, startSession, endSession,
        sessionDetails, sessionAppointments, getSessionAppointments, completeSessionAppointment,
        bookWalkInAppointment,
        addSession,
        requestRefund,
        requestCashRefund,
    }

    return (
        <ReceptionContext.Provider value={value}>
            {props.children}
        </ReceptionContext.Provider>
    )

}

export default ReceptionContextProvider