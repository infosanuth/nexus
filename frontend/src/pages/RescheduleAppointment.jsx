
import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const RescheduleAppointment = () => {
    const { docId } = useParams()
    const navigate = useNavigate()
    const { doctors, currencySymbol, backendUrl, token, userData } = useContext(AppContext)

    const state = window.history.state?.usr || {} // 👈 get state passed from navigate()
    const { slotDate, slotTime: oldSlotTime, appointmentId, userId } = state

    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    const [docInfo, setDocInfo] = useState(null)
    const [docSlots, setdocSlots] = useState([])
    const [slotIndex, setslotIndex] = useState(0)
    const [slotTime, setSlotTime] = useState('')


    const fetchDocInfo = async () => {
        const docInfo = doctors.find(doc => doc._id === docId)
        setDocInfo(docInfo)
    }

    const getAvailableSlots = async () => {
        setdocSlots([])

        let today = new Date()
        for (let i = 0; i < 7; i++) {
            let currentDate = new Date(today)
            currentDate.setDate(today.getDate() + i)

            let endTime = new Date()
            endTime.setDate(today.getDate() + i)
            endTime.setHours(21, 0, 0, 0)

            if (today.getDate() === currentDate.getDate()) {
                currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 : 10)
                currentDate.setMinutes(currentDate.getHours() > 30 ? 30 : 0)
            } else {
                currentDate.setHours(10)
                currentDate.setMinutes(0)
            }

            let timeSlots = []

            while (currentDate < endTime) {
                let formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                let day = currentDate.getDate()
                let month = currentDate.getMonth() + 1
                let year = currentDate.getFullYear()
                const slotDate = `${day}_${month}_${year}`

                const isSlotAvailable = !(docInfo.slots_booked?.[slotDate]?.includes(formattedTime))

                if (isSlotAvailable) {
                    timeSlots.push({
                        datetime: new Date(currentDate),
                        time: formattedTime,
                    })
                }

                currentDate.setMinutes(currentDate.getMinutes() + 30)
            }

            setdocSlots(prev => [...prev, timeSlots])
        }
    }

    const rescheduleAppointment = async () => {
        if (!slotTime) {
            toast.error("Please select a new time slot")
            return
        }

        const selectedDateObj = docSlots[slotIndex][0]?.datetime
        if (!selectedDateObj) {
            toast.error("Invalid slot date")
            return
        }

        const newSlotDate = selectedDateObj
            .toLocaleDateString('en-GB')
            .split('/')
            .join('_') // format to dd_mm_yyyy

        try {
            const { data } = await axios.post(backendUrl + "/api/user/reschedule-appointment", { appointmentId, userId, newSlotDate, newSlotTime: slotTime, }, { headers: { token }, })

            if (data.success) {
                toast.success(data.message)
                // getDoctorsData()
                navigate('/my-appointment')
            } else {
                toast.error(data.message || "Failed to reschedule appointment")
            }
        } catch (error) {
            console.error("Reschedule error:", error)
            toast.error("Failed to reschedule appointment")
        }
    }

    useEffect(() => {
        getAvailableSlots()
    }, [docInfo])

    useEffect(() => {
        fetchDocInfo()
    }, [doctors, docId])

    useEffect(() => {
        if (docInfo) {
            getAvailableSlots()
        }
    }, [docInfo])

    return docInfo && (
        <div>
            {/* Doctor info */}
            <div className='flex flex-col sm:flex-row gap-4'>
                <img className='bg-[#64748B] w-full sm:max-w-72 rounded-lg' src={`${backendUrl}${docInfo.image}`} alt="" />
                <div className='flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>
                    <p className='flex items-center gap-2 text-2xl font-medium text-gray-900'>
                        {docInfo.name}
                        <img className='w-5' src={assets.verified_icon} alt="" />
                    </p>
                    <div className='flex items-center gap-2 text-sm mt-1 text-gray-600'>
                        <p>{docInfo.degree} - {docInfo.speciality}</p>
                        <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
                    </div>
                    <div>
                        <p className='flex items-center gap-1 text-sm font-medium text-gray-900 mt-3'>
                            About <img src={assets.info_icon} alt="" />
                        </p>
                        <p className='text-sm text-gray-500 max-w-[700px] mt-1'>{docInfo.about}</p>
                    </div>
                    <p className='text-gray-600 font-medium mt-4'>
                        Appointment fee: <span className='text-gray-600'>{currencySymbol}{docInfo.fees}</span>
                    </p>
                </div>
            </div>

            {/* Slots */}
            <div className='sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700'>
                <p>Booking slots</p>
                <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4'>
                    {docSlots.map((item, index) => (
                        <div
                            onClick={() => setslotIndex(index)}
                            className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? 'bg-primary text-white' : 'border border-gray-200'}`}
                            key={index}
                        >
                            <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                            <p>{item[0] && item[0].datetime.getDate()}</p>
                        </div>
                    ))}
                </div>

                <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4'>
                    {docSlots[slotIndex]?.map((item, index) => (
                        <p
                            onClick={() => setSlotTime(item.time)}
                            className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ? 'bg-primary text-white' : 'text-gray-400 border border-gray-200'}`}
                            key={index}
                        >
                            {item.time.toLowerCase()}
                        </p>
                    ))}
                </div>

                <button
                    onClick={rescheduleAppointment}
                    className='bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-6'
                >
                    Re-schedule Appointment
                </button>
            </div>
        </div>
    )
}

export default RescheduleAppointment

