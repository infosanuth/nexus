import { createContext, useState } from "react";
import axios from 'axios'
import { toast } from 'react-toastify'


export const AdminContext = createContext();

const AdminContextProvider = (props) => {

    const [aToken, setAToken] = useState(localStorage.getItem('aToken') ? localStorage.getItem('aToken') : '')
    const [doctors, setDoctors] = useState([])
    const [appointments, setAppointments] = useState([])
    const [dashData, setDashData] = useState(false)
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [appointmentBySpeciallity, SetAppointmentBySpeciallity] = useState([]);
    const [appointmentByChannel, setAppointmentByChannel] = useState([]);
    const [specialities, setSpecialities] = useState([])
    const [staff, setStaff] = useState([])
    const [sessions, setSessions] = useState([])


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


    const value = {
        aToken, setAToken,
        backendUrl, doctors,
        getAllDoctors, changeAvailability,
        appointments, setAppointments,
        getAllAppointments,
        cancelAppointment,
        dashData, getDashData,
        monthlyRevenue, getMonthlyRevenue,
        appointmentBySpeciallity, SpecialtyPieChart,
        appointmentByChannel, ChannelPieChart,
        specialities, getSpecialities,
        staff, getAllStaff, deleteStaff, updateStaff,
        sessions, getSessions
    }

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )
}

export default AdminContextProvider
