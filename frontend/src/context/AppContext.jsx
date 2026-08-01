import { createContext, useEffect, useState } from "react";
import axios from 'axios'
import { toast } from 'react-toastify'

export const AppContext = createContext()

const AppContextProvider = (props) => {

    const currencySymbol = 'Rs '
    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [doctors, setDoctors] = useState([])
    const [specialities, setSpecialities] = useState([])
    const [token, setToken] = useState(localStorage.getItem('token') ? localStorage.getItem('token') : '')
    const [userData, setUserData] = useState()


    // Getting Doctors using API
    const getDoctorsData = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/doctor/list')

            if (data.success) {
                setDoctors(data.doctors)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Getting Specialities using API
    const getSpecialityData = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/admin/specialities')

            if (data.success) {
                setSpecialities(data.specialities)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    // Getting User Profile using API
    const loadUserProfileData = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/user/get-profile', { headers: { token } })

            if (data.success) {
                setUserData(data.userData)
            } else {
                toast.error(data.message)
                localStorage.removeItem('token')
                setToken('')
            }
            
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }
    
    // Change user password using API
    const changeMyPassword = async (currentPassword, newPassword) => {
        try {

            const { data } = await axios.post(backendUrl + '/api/user/change-password', { currentPassword, newPassword }, { headers: { token } })

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
        doctors, getDoctorsData,
        specialities, getSpecialityData,
        currencySymbol,
        backendUrl,
        token, setToken,
        userData, setUserData, loadUserProfileData,
        changeMyPassword
    }

    useEffect(() => {
        getDoctorsData()
        getSpecialityData()
    }, [])

    useEffect(() => {
        if (token) {
            loadUserProfileData()
        } else {
            setUserData(false)
        }
    }, [token])

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}
export default AppContextProvider