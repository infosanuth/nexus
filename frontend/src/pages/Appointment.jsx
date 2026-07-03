import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import axios from 'axios'
import { toast } from 'react-toastify'

// Convert 24-hour "HH:MM" to "hh:mm AM/PM" to match backend slotTime format
const formatTime12 = (time24) => {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`
}

// "YYYY-MM-DD" key used to compare calendar days with session dates
const formatDateKey = (year, month, day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

// session.date is stored as UTC midnight, so read it back using UTC getters
const getSessionDateKey = (session) => {
  const d = new Date(session.date)
  return formatDateKey(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const Appointment = () => {

  const { docId } = useParams()
  const { doctors, specialities, currencySymbol, backendUrl, token, getDoctorsData } = useContext(AppContext)

  const [docInfo, setDocInfo] = useState(null)
  const [sessions, setSessions] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [selectedSessionId, setSelectedSessionId] = useState('')

  const navigate = useNavigate()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const fetchDocInfo = async () => {
    const docInfo = doctors.find(doc => doc._id === docId)
    setDocInfo(docInfo)
  }

  const getDoctorSessions = async () => {
    try {

      const { data } = await axios.get(backendUrl + '/api/doctor/sessions/' + docId)

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

  const bookAppointment = async () => {

    if (!token) {
      toast.warning('Login to book an appointment')
      return navigate('/login')
    }

    if (!selectedSessionId) {
      return toast.error('Please choose a session')
    }

    const session = sessions.find(item => item._id === selectedSessionId)

    const sessionDate = new Date(session.date)
    const slotDate = `${sessionDate.getUTCDate()}_${sessionDate.getUTCMonth() + 1}_${sessionDate.getUTCFullYear()}`
    const slotTime = formatTime12(session.startTime)

    try {

      const { data } = await axios.post(backendUrl + '/api/user/book-appointment', { docId, slotDate, slotTime }, { headers: { token } })
      if (data.success) {
        toast.success(data.message)
        getDoctorsData()
        getDoctorSessions()
        payForAppointment(data.appointmentId)
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  // Opens the PayHere payment popup for the newly booked appointment
  const payForAppointment = async (appointmentId) => {
    try {

      if (!window.payhere || typeof window.payhere.startPayment !== 'function') {
        toast.error('PayHere SDK not loaded. Please try again later.')
        navigate('/my-appointment')
        return
      }

      const { data } = await axios.post(backendUrl + '/api/user/payment-payhere', { appointmentId }, { headers: { token } })

      if (!data.success) {
        toast.error(data.message)
        navigate('/my-appointment')
        return
      }

      const payment = data.paymentDetails

      window.payhere.onCompleted = async function (orderId) {
        toast.info('Payment completed. Verifying payment...')

        try {
          const { data } = await axios.post(backendUrl + '/api/user/verifyPayhere', { order_id: orderId, status_code: '2' }, { headers: { token } })

          if (data.success) {
            toast.success('Payment verified successfully!')
          } else {
            toast.error('Payment verification failed.')
          }
        } catch (error) {
          console.error('PayHere verify error:', error)
          toast.error('Error verifying payment.')
        } finally {
          navigate('/my-appointment')
        }
      }

      window.payhere.onDismissed = function () {
        toast.info('Payment was cancelled. You can pay later from My Appointments.')
        navigate('/my-appointment')
      }

      window.payhere.onError = function (error) {
        toast.error('Payment error: ' + error)
        navigate('/my-appointment')
      }

      window.payhere.startPayment(payment)

    } catch (error) {
      console.log(error)
      toast.error('Something went wrong: ' + error.message)
      navigate('/my-appointment')
    }
  }

  useEffect(() => {
    fetchDocInfo()
  }, [doctors, docId])

  useEffect(() => {
    getDoctorSessions()
  }, [docId])

  // Default to the earliest date that has sessions
  useEffect(() => {
    if (sessions.length > 0 && !selectedDate) {
      const d = new Date(sessions[0].date)
      const localDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
      setSelectedDate(localDate)
      setCalendarMonth(new Date(localDate.getFullYear(), localDate.getMonth(), 1))
    }
  }, [sessions])

  const sessionDateKeys = new Set(sessions.map(getSessionDateKey))

  const generateCalendarDays = (monthDate) => {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startWeekday = new Date(year, month, 1).getDay()

    const days = []
    for (let i = 0; i < startWeekday; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d))
    return days
  }

  const calendarDays = generateCalendarDays(calendarMonth)

  const isPrevMonthDisabled = calendarMonth.getFullYear() === today.getFullYear() && calendarMonth.getMonth() === today.getMonth()

  const changeMonth = (delta) => {
    setCalendarMonth(prev => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + delta, 1)
      const minMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      return next < minMonth ? prev : next
    })
  }

  const selectedDateKey = selectedDate ? formatDateKey(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()) : null

  const sessionsForSelectedDate = sessions
    .filter(item => getSessionDateKey(item) === selectedDateKey)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 3)

  const hospitalCharge = specialities.find(item => item.speciality === docInfo?.speciality)?.channelingFee ?? 0


  return docInfo && (
    <div>
      {/* Doctors Details */}
      <div className='flex flex-col gap-4 sm:flex-row'>
        <div className='w-full sm:max-w-72'>
          {docInfo.image ? (
            <img className='bg-[#64748B] w-full rounded-lg' src={`${backendUrl}${docInfo.image}`} alt="" />
          ) : (
            <div className='bg-[#64748B] w-full aspect-square rounded-lg flex items-center justify-center'>
              <img className='w-32 h-32' src={assets.default_doctor_pastel} alt="" />
            </div>
          )}
        </div>

        <div className='flex-1 border border-gray-200 rounded-lg p-6 sm:p-8 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0 shadow-sm'>
          {/* Name */}
          <p className='flex items-center gap-2 text-2xl font-semibold text-gray-900'>
            {docInfo.name}
            <img className='w-5' src={assets.verified_icon} alt="" />
          </p>

          {/* Speciality */}
          <p className='mt-1 text-sm font-medium text-primary'>{docInfo.speciality}</p>

          {/* Degree & experience */}
          <div className='flex items-center gap-2 mt-2 text-sm text-gray-600'>
            <p>{docInfo.degree}</p>
            <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
          </div>

          {/* Practising hospital & registration */}
          <div className='flex flex-col gap-1 mt-3 text-sm text-gray-600'>
            <p>Practising Government Hospitals - Teaching Hospital Karapitiya</p>
            <p>Registration - D108215</p>
          </div>

          {/* Fees */}
          <div className='flex flex-col gap-1 mt-4 text-sm text-gray-700'>
            <p>Doctor Fee - {currencySymbol}{docInfo.fees}</p>
            <p>Hospital Charges - {currencySymbol}{hospitalCharge}</p>
          </div>
        </div>
      </div>

      {/* Available sessions */}
      <div className='mt-6'>
        <p className='mb-4 text-lg font-semibold text-gray-800'>Available Sessions</p>

        {sessions.length === 0
          ? <p className='text-sm text-gray-400'>No sessions available right now</p>
          : <div className='flex flex-col gap-6 md:flex-row'>

            {/* Calendar */}
            <div className='w-full p-4 bg-white border border-blue-200 rounded-xl md:w-72 shrink-0'>
              <div className='flex items-center justify-between mb-3'>
                <button
                  onClick={() => changeMonth(-1)}
                  disabled={isPrevMonthDisabled}
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-gray-500 ${isPrevMonthDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-blue-50 cursor-pointer'}`}
                >
                  ‹
                </button>
                <p className='text-sm font-medium text-gray-800'>
                  {calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <button
                  onClick={() => changeMonth(1)}
                  className='flex items-center justify-center text-gray-500 rounded-full cursor-pointer w-7 h-7 hover:bg-blue-50'
                >
                  ›
                </button>
              </div>

              <div className='grid grid-cols-7 mb-1 text-xs text-center text-gray-400 gap-y-1'>
                {weekDays.map((d, i) => <p key={i}>{d}</p>)}
              </div>

              <div className='grid grid-cols-7 gap-y-1'>
                {calendarDays.map((day, idx) => {
                  if (!day) return <div key={idx} />

                  const key = formatDateKey(day.getFullYear(), day.getMonth(), day.getDate())
                  const hasSessions = sessionDateKeys.has(key)
                  const isPast = day < today
                  const isSelected = selectedDateKey === key
                  const isToday = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate()) === key

                  return (
                    <div key={idx} className='flex justify-center'>
                      <button
                        disabled={!hasSessions || isPast}
                        onClick={() => { setSelectedDate(day); setSelectedSessionId('') }}
                        className={`h-9 w-9 flex items-center justify-center rounded-full text-sm transition-colors
                          ${isSelected
                            ? 'bg-primary text-white font-medium'
                            : hasSessions && !isPast
                              ? 'text-gray-700 hover:bg-blue-50 cursor-pointer font-medium'
                              : 'text-gray-300 cursor-not-allowed'}
                          ${isToday && !isSelected ? 'ring-1 ring-primary' : ''}`}
                      >
                        {day.getDate()}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Session times for the selected date */}
            <div className='flex-1'>
              {selectedDate &&
                <p className='mb-3 text-sm font-medium text-gray-800'>
                  {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              }

              <div className='grid max-w-md grid-cols-3 gap-2 sm:gap-3'>
                {sessionsForSelectedDate.map((item) => {
                  const availableSlots = item.maxPatients - item.bookedPatientsCount
                  const isFull = availableSlots <= 0
                  const isSelected = selectedSessionId === item._id

                  return (
                    <button
                      key={item._id}
                      disabled={isFull}
                      onClick={() => setSelectedSessionId(item._id)}
                      className={`flex flex-col items-center justify-center gap-1 h-20 px-2 rounded-lg border text-center transition-colors
                        ${isFull
                          ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400'
                          : isSelected
                            ? 'bg-primary text-white border-primary'
                            : 'border-gray-200 text-gray-600 hover:border-primary'}`}
                    >
                      <p className='text-xs font-medium leading-tight sm:text-sm'>
                        {formatTime12(item.startTime)}{item.endTime ? ` - ${formatTime12(item.endTime)}` : ''}
                      </p>
                      <p className={`text-[10px] sm:text-xs ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                        {isFull ? 'Fully booked' : `${availableSlots} slot${availableSlots > 1 ? 's' : ''} left`}
                      </p>
                    </button>
                  )
                })}
              </div>

              <button onClick={bookAppointment} className='py-3 mt-6 text-sm font-light text-white rounded-full bg-primary px-14'>Book an appointment</button>
            </div>
          </div>
        }
      </div>

      {/* Listing Related Doctors */}
      <RelatedDoctors docId={docId} speciality={docInfo.speciality} />


    </div>
  )


}

export default Appointment
