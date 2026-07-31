import { createContext, useState } from "react";
import axios from 'axios'
import { toast } from 'react-toastify'


export const AdminContext = createContext();

const AdminContextProvider = (props) => {

    const [aToken, setAToken] = useState(localStorage.getItem('aToken') ? localStorage.getItem('aToken') : '')
    const [aName, setAName] = useState(localStorage.getItem('aName') ? localStorage.getItem('aName') : '')
    const [myProfile, setMyProfile] = useState(false)
    const [doctors, setDoctors] = useState([])
    const [appointments, setAppointments] = useState([])
    const [noShows, setNoShows] = useState([])
    const [dashData, setDashData] = useState(false)
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [appointmentBySpeciallity, SetAppointmentBySpeciallity] = useState([]);
    const [appointmentByChannel, setAppointmentByChannel] = useState([]);
    const [specialities, setSpecialities] = useState([])
    const [staff, setStaff] = useState([])
    const [sessions, setSessions] = useState([])
    const [sessionDetails, setSessionDetails] = useState(false)
    const [sessionAppointments, setSessionAppointments] = useState([])
    const [sessionReport, setSessionReport] = useState([])
    const [appointmentReport, setAppointmentReport] = useState([])
    const [cancelRateReport, setCancelRateReport] = useState([])
    const [specialityReport, setSpecialityReport] = useState([])
    const [doctorPerformance, setDoctorPerformance] = useState([])


    const backendUrl = import.meta.env.VITE_BACKEND_URL

    // Getting all doctors data
    const getAllDoctors = async () => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/all-doctors', {}, { headers: { aToken } })
            if (data.success) {
                setDoctors(data.doctors)
                console.log(data.doctors)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Toggling doctor availability status
    const changeAvailability = async (docId) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/admin/change-availability', { docId }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                getAllDoctors()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }

    }

    // Getting all appointment data
    const getAllAppointments = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/appointments', { headers: { aToken } })
            if (data.success) {
                setAppointments(data.appointments.reverse())
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    // Function to get no-show appointments across all doctors (paid, session started & ended, never completed)
    const getNoShows = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/no-shows', { headers: { aToken } })
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

    // Cancelling an appointment by ID
    const cancelAppointment = async (appointmentId) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/admin/cancel-appointment', { appointmentId }, { headers: { aToken } })

            if (data.success) {
                toast.success(data.message)
                getAllAppointments()
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }

    }

    // Getting dashboard summary data
    const getDashData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/dashboard', { headers: { aToken } })
            if (data.success) {
                setDashData(data.dashData)
                console.log(data.dashData)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    // Getting monthly revenue data for chart
    const getMonthlyRevenue = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/monthly-revenue', { headers: { aToken } });

            if (data.success) {
                setMonthlyRevenue(data.monthlyRevenue);
                console.log(data.monthlyRevenue);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
            console.log(error);
        }
    };

    // Getting appointment counts grouped by specialty for pie chart
    const SpecialtyPieChart = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/specialty-count', { headers: { aToken } });
            if (data.success) {
                SetAppointmentBySpeciallity(data.data);
                console.log(data.data);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
            console.log(error);
        }
    }

    // Getting appointment counts grouped by booking channel (online vs walk-in) for pie chart
    const ChannelPieChart = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/channel-count', { headers: { aToken } });
            if (data.success) {
                setAppointmentByChannel(data.data);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
            console.log(error);
        }
    }

    // Getting all staff (admins and receptionists)
    const getAllStaff = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/staff', { headers: { aToken } })
            if (data.success) {
                setStaff(data.staff)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Deleting a staff member
    const deleteStaff = async (staffId) => {
        try {
            const { data } = await axios.delete(backendUrl + `/api/admin/delete-staff/${staffId}`, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                setStaff(prev => prev.filter(member => member._id !== staffId))
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    // Updating a staff member's name and email
    const updateStaff = async (staffId, { name, email }) => {
        try {
            const { data } = await axios.put(backendUrl + `/api/admin/update-staff/${staffId}`, { name, email }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                setStaff(prev => prev.map(member => member._id === staffId ? data.staff : member))
                return true
            } else {
                toast.error(data.message)
                return false
            }
        } catch (error) {
            toast.error(error.message)
            return false
        }
    }

    // Getting all doctor sessions (with earnings) for admin
    const getSessions = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/sessions', { headers: { aToken } })
            if (data.success) {
                setSessions(data.sessions)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    // Getting the all-time per-doctor session/earnings/profit summary for admin
    const getSessionReport = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/session-report', { headers: { aToken } })
            if (data.success) {
                setSessionReport(data.report)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    // Getting the all-time per-doctor appointment/earnings/profit summary for admin
    const getAppointmentReport = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/appointment-report', { headers: { aToken } })
            if (data.success) {
                setAppointmentReport(data.report)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    // Getting the per-doctor cancel-rate (paid-cancel appointment % and cancel session %) summary for admin, optionally scoped to a period
    const getCancelRateReport = async (period = 'all') => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/cancel-rate-report', { params: { period }, headers: { aToken } })
            if (data.success) {
                setCancelRateReport(data.report)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    // Getting the per-speciality doctor-count/earnings/profit summary for admin, optionally scoped to a period
    const getSpecialityReport = async (period = 'all') => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/speciality-report', { params: { period }, headers: { aToken } })
            if (data.success) {
                setSpecialityReport(data.report)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    // Getting the per-doctor fee-revenue/hospital-profit performance summary for admin, optionally scoped to a period
    const getDoctorPerformance = async (period = 'all') => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/doctor-performance', { params: { period }, headers: { aToken } })
            if (data.success) {
                setDoctorPerformance(data.report)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    // Getting the appointments booked under a single session, for the admin session drill-down (read-only)
    const getSessionAppointments = async (sessionId) => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/session-appointments/' + sessionId, { headers: { aToken } })
            if (data.success) {
                setSessionDetails(data.session)
                setSessionAppointments(data.appointments)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }

    // Getting all specialities data
    const getSpecialities = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/specialities')
            if (data.success) {
                setSpecialities(data.specialities)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
            console.log(error)
        }
    }


    // Function to get the currently logged-in admin's own profile
    const getMyProfile = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/my-profile', { headers: { aToken } })
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

    // Function to update the currently logged-in admin's own name
    const updateMyProfile = async (name) => {
        try {
            const { data } = await axios.put(backendUrl + '/api/admin/update-my-profile', { name }, { headers: { aToken } })
            if (data.success) {
                toast.success(data.message)
                setMyProfile(data.profile)
                setAName(data.profile.name)
                localStorage.setItem('aName', data.profile.name)
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

    // Function to change the currently logged-in admin's own password
    const changeMyPassword = async (currentPassword, newPassword) => {
        try {
            const { data } = await axios.post(backendUrl + '/api/admin/change-password', { currentPassword, newPassword }, { headers: { aToken } })
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
        aToken, setAToken,
        aName, setAName,
        myProfile, getMyProfile, updateMyProfile, changeMyPassword,
        backendUrl, doctors,
        getAllDoctors, changeAvailability,
        appointments, setAppointments,
        getAllAppointments,
        noShows, getNoShows,
        cancelAppointment,
        dashData, getDashData,
        monthlyRevenue, getMonthlyRevenue,
        appointmentBySpeciallity, SpecialtyPieChart,
        appointmentByChannel, ChannelPieChart,
        specialities, getSpecialities,
        staff, getAllStaff, deleteStaff, updateStaff,
        sessions, getSessions,
        sessionDetails, sessionAppointments, getSessionAppointments,
        sessionReport, getSessionReport,
        appointmentReport, getAppointmentReport,
        cancelRateReport, getCancelRateReport,
        specialityReport, getSpecialityReport,
        doctorPerformance, getDoctorPerformance
    }

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )
}

export default AdminContextProvider
