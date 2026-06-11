import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ReceptionContext } from '../../context/ReceptionContext'

// Convert 24-hour "HH:MM" session time to "h:mm AM/PM"
const convertTo12Hour = (time24) => {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
}

// session.date is stored as UTC midnight, so read it back using UTC
const formatSessionDate = (date) => {
  const d = new Date(date)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}

const PatientCheckIn = () => {

  const { backendUrl, rToken } = useContext(ReceptionContext)

  const [specialities, setSpecialities] = useState([])
  const [doctors, setDoctors] = useState([])
  const [filteredDoctors, setFilteredDoctors] = useState([])

  const [speciality, setSpeciality] = useState('')
  const [docId, setDocId] = useState('')
  const [sessions, setSessions] = useState([])
  const [sessionId, setSessionId] = useState('')

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('Not Selected')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [payment, setPayment] = useState(false)

  const [loading, setLoading] = useState(false)

  const selectedDoctor = doctors.find(doc => doc._id === docId)

  // Getting all specialities for the speciality filter
  const getSpecialities = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/admin/specialities')
      if (data.success) {
        setSpecialities(data.specialities)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Getting all doctors
  const getDoctors = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/doctor/list')
      if (data.success) {
        setDoctors(data.doctors)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Getting upcoming active sessions for the selected doctor
  const getDoctorSessions = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/doctor/sessions/' + docId)
      if (data.success) {
        setSessions(data.sessions)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    getSpecialities()
    getDoctors()
  }, [])

  // Filter doctors by selected speciality
  useEffect(() => {
    setFilteredDoctors(speciality ? doctors.filter(doc => doc.speciality === speciality) : doctors)
    setDocId('')
  }, [speciality, doctors])

  // Load sessions whenever the selected doctor changes
  useEffect(() => {
    setSessionId('')
    if (docId) {
      getDoctorSessions()
    } else {
      setSessions([])
    }
  }, [docId])

  const resetForm = () => {
    setSpeciality('')
    setDocId('')
    setSessions([])
    setSessionId('')
    setName('')
    setAge('')
    setGender('Not Selected')
    setPhoneNumber('')
    setPayment(false)
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    if (!docId) return toast.error('Please select a doctor')
    if (!sessionId) return toast.error('Please select a session')
    if (!name || !phoneNumber) return toast.error('Patient name and phone number are required')

    setLoading(true)
    try {
      const { data } = await axios.post(backendUrl + '/api/reception/book-appointment', {
        docId,
        sessionId,
        patientDetails: { name, age, gender, phoneNumber },
        payment
      }, { headers: { rToken } })

      if (data.success) {
        toast.success(data.message)
        resetForm()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='m-5 w-full'>

      <p className='mb-3 text-lg font-medium'>Walk-in Appointment</p>

      <div className='bg-white px-8 py-8 border rounded w-full max-w-3xl flex flex-col gap-6 text-gray-600'>

        {/* Step 1: Speciality / Doctor */}
        <div>
          <p className='mb-2 font-medium text-gray-800'>1. Select Speciality &amp; Doctor</p>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1 flex flex-col gap-1'>
              <p>Speciality</p>
              <select value={speciality} onChange={(e) => setSpeciality(e.target.value)} className='border rounded px-3 py-2'>
                <option value=''>All Specialities</option>
                {specialities.map((item) => (
                  <option key={item._id} value={item.speciality}>{item.speciality}</option>
                ))}
              </select>
            </div>

            <div className='flex-1 flex flex-col gap-1'>
              <p>Doctor</p>
              <select value={docId} onChange={(e) => setDocId(e.target.value)} className='border rounded px-3 py-2' required>
                <option value=''>Select Doctor</option>
                {filteredDoctors.map((doc) => (
                  <option key={doc._id} value={doc._id} disabled={!doc.available}>
                    {doc.name}{!doc.available ? ' (Unavailable)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Session */}
        <div>
          <p className='mb-2 font-medium text-gray-800'>2. Select Session</p>
          {!docId ? (
            <p className='text-sm text-gray-400'>Select a doctor to view available sessions</p>
          ) : sessions.length === 0 ? (
            <p className='text-sm text-gray-400'>No upcoming sessions for this doctor</p>
          ) : (
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'>
              {sessions.map((item) => {
                const availableSlots = item.maxPatients - item.bookedPatientsCount
                const isFull = availableSlots <= 0
                const isSelected = sessionId === item._id

                return (
                  <button
                    key={item._id}
                    type='button'
                    disabled={isFull}
                    onClick={() => setSessionId(item._id)}
                    className={`flex flex-col items-center justify-center gap-1 w-full min-h-[5.5rem] px-4 py-3 rounded-lg border text-center text-xs sm:text-sm transition-colors
                      ${isFull
                        ? 'opacity-50 cursor-not-allowed border-gray-200 text-gray-400'
                        : isSelected
                          ? 'bg-primary text-white border-primary'
                          : 'border-gray-300 text-gray-600 hover:border-primary'}`}
                  >
                    <span className='font-medium leading-tight whitespace-nowrap'>{formatSessionDate(item.date)}</span>
                    <span className='leading-tight whitespace-nowrap'>{convertTo12Hour(item.startTime)}{item.endTime ? ` - ${convertTo12Hour(item.endTime)}` : ''}</span>
                    <span className={`text-[10px] sm:text-xs whitespace-nowrap ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                      {isFull ? 'Fully booked' : `${availableSlots} slot${availableSlots > 1 ? 's' : ''} left`}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Step 3: Patient details */}
        <div>
          <p className='mb-2 font-medium text-gray-800'>3. Patient Details</p>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1 flex flex-col gap-1'>
              <p>Full Name</p>
              <input value={name} onChange={(e) => setName(e.target.value)} className='border rounded px-3 py-2' type='text' placeholder='Patient name' required />
            </div>
            <div className='flex-1 flex flex-col gap-1'>
              <p>Phone Number</p>
              <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className='border rounded px-3 py-2' type='tel' placeholder='07XXXXXXXX' required />
            </div>
          </div>
          <div className='flex flex-col sm:flex-row gap-4 mt-4'>
            <div className='flex-1 flex flex-col gap-1'>
              <p>Age</p>
              <input value={age} onChange={(e) => setAge(e.target.value)} className='border rounded px-3 py-2' type='number' min='0' placeholder='Age' />
            </div>
            <div className='flex-1 flex flex-col gap-1'>
              <p>Gender</p>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className='border rounded px-3 py-2'>
                <option value='Not Selected'>Not Selected</option>
                <option value='Male'>Male</option>
                <option value='Female'>Female</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 4: Payment */}
        <div>
          <p className='mb-2 font-medium text-gray-800'>4. Payment</p>
          <button
            type='button'
            onClick={() => setPayment((prev) => !prev)}
            className={`px-5 py-2 rounded-full border text-sm font-medium transition-colors ${payment ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-600 hover:border-primary'}`}
          >
            {payment ? 'Paid ✓' : 'Mark as Paid'}
          </button>
          {selectedDoctor && (
            <p className='mt-2 text-sm text-gray-500'>Consultation fee: Rs {selectedDoctor.fees}</p>
          )}
        </div>

        <button type='submit' disabled={loading} className='bg-primary text-white text-sm px-10 py-3 rounded-full w-fit disabled:opacity-60'>
          {loading ? 'Booking...' : 'Book Appointment'}
        </button>

      </div>
    </form>
  )
}

export default PatientCheckIn
