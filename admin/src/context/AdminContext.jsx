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
    const [specialities, setSpecialities] = useState([])


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
        specialities, getSpecialities
    }

    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )
}

export default AdminContextProvider
