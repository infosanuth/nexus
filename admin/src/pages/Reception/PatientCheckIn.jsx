import React, { useContext, useEffect, useRef, useState } from 'react'
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

// Strip out anything that isn't a letter or a space
const filterLettersOnly = (value) => {
  let result = ''
  for (let i = 0; i < value.length; i++) {
    const char = value[i]
    const isLetter = (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === ' '
    if (isLetter) result += char
  }
  return result
}

// Phone number must be exactly 10 digits and start with "07"
const isValidPhoneNumber = (value) => {
  if (value.length !== 10) return false
  if (value[0] !== '0' || value[1] !== '7') return false
  for (let i = 0; i < value.length; i++) {
    if (value[i] < '0' || value[i] > '9') return false
  }
  return true
}

const SESSIONS_PER_PAGE = 12

const PatientCheckIn = () => {

  const { backendUrl, bookWalkInAppointment } = useContext(ReceptionContext)

  const [specialities, setSpecialities] = useState([])
  const [doctors, setDoctors] = useState([])
  const [filteredDoctors, setFilteredDoctors] = useState([])

  const [speciality, setSpeciality] = useState('')
  const [docId, setDocId] = useState('')
  const [doctorSearch, setDoctorSearch] = useState('')
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false)
  const doctorDropdownRef = useRef(null)
  const [sessions, setSessions] = useState([])
  const [sessionId, setSessionId] = useState('')
  const [sessionPage, setSessionPage] = useState(0)

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('Not Selected')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [payment, setPayment] = useState(false)

  const [loading, setLoading] = useState(false)

  const selectedDoctor = doctors.find(doc => doc._id === docId)
  const doctorSearchResults = filteredDoctors.filter(doc => doc.name.toLowerCase().includes(doctorSearch.toLowerCase()))
  const hospitalCharge = specialities.find(item => item.speciality === selectedDoctor?.speciality)?.channelingFee ?? 0

  const handleSelectDoctor = (doc) => {
    setDocId(doc._id)
    setDoctorSearch(doc.name)
    setIsDoctorDropdownOpen(false)
  }

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

  // Close the doctor search dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(event.target)) {
        setIsDoctorDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter doctors by selected speciality
  useEffect(() => {
    setFilteredDoctors(speciality ? doctors.filter(doc => doc.speciality === speciality) : doctors)
    setDocId('')
    setDoctorSearch('')
  }, [speciality, doctors])

  // Load sessions whenever the selected doctor changes
  useEffect(() => {
    setSessionId('')
    setSessionPage(0)
    if (docId) {
      getDoctorSessions()
    } else {
      setSessions([])
    }
  }, [docId])

  const totalSessionPages = Math.ceil(sessions.length / SESSIONS_PER_PAGE)
  const paginatedSessions = sessions.slice(sessionPage * SESSIONS_PER_PAGE, (sessionPage + 1) * SESSIONS_PER_PAGE)

  const resetForm = () => {
    setSpeciality('')
    setDocId('')
    setDoctorSearch('')
    setSessions([])
    setSessionId('')
    setSessionPage(0)
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
    if (name.trim().length < 8 || name.trim().length > 24) return toast.error('Patient name must be between 8 and 24 characters')
    if (!isValidPhoneNumber(phoneNumber)) return toast.error('Phone number must be 10 digits and start with 07')
    if (gender === 'Not Selected') return toast.error('Please select a gender')
    // if (age && (Number(age) < 1 || Number(age) > 120)) return toast.error('Age must be between 1 and 120')

    setLoading(true)
    try {
      const success = await bookWalkInAppointment({
        docId,
        sessionId,
        patientDetails: { name, age, gender, phoneNumber },
        payment
      })

      if (success) {
        resetForm()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='w-full m-5'>

      <p className='mb-3 text-lg font-medium'>Walk-in Appointment</p>

      <div className='flex flex-col w-full max-w-3xl gap-6 px-8 py-8 text-gray-600 bg-white border rounded'>

        {/* Step 1: Speciality / Doctor */}
        <div>
          <p className='mb-2 font-medium text-gray-800'>1. Select Speciality &amp; Doctor</p>
          <div className='flex flex-col gap-4 sm:flex-row'>
            <div className='flex flex-col flex-1 gap-1'>
              <p>Speciality</p>
              <select value={speciality} onChange={(e) => setSpeciality(e.target.value)} className='px-3 py-2 border rounded'>
                <option value=''>All Specialities</option>
                {specialities.map((item) => (
                  <option key={item._id} value={item.speciality}>{item.speciality}</option>
                ))}
              </select>
            </div>

            <div className='relative flex flex-col flex-1 gap-1' ref={doctorDropdownRef}>
              <p>Doctor</p>
              <input
                type='text'
                value={doctorSearch}
                onChange={(e) => {
                  setDoctorSearch(e.target.value)
                  setDocId('')
                  setIsDoctorDropdownOpen(true)
                }}
                onFocus={() => setIsDoctorDropdownOpen(true)}
                placeholder='Search doctor'
                className='px-3 py-2 border rounded'
                autoComplete='off'
              />
              {isDoctorDropdownOpen && (
                <div className='absolute left-0 right-0 z-10 mt-1 overflow-y-auto bg-white border rounded shadow-lg top-full max-h-56'>
                  {doctorSearchResults.length === 0 ? (
                    <p className='px-3 py-2 text-sm text-gray-400'>No doctors found</p>
                  ) : (
                    doctorSearchResults.map((doc) => (
                      <button
                        key={doc._id}
                        type='button'
                        disabled={!doc.available}
                        onClick={() => handleSelectDoctor(doc)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100
                          ${!doc.available ? 'opacity-50 cursor-not-allowed' : ''}
                          ${docId === doc._id ? 'bg-primary/10 text-primary' : ''}`}
                      >
                        {doc.name}{!doc.available ? ' (Unavailable)' : ''}
                      </button>
                    ))
                  )}
                </div>
              )}
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
            <>
              <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4'>
                {paginatedSessions.map((item) => {
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

              {totalSessionPages > 1 && (
                <div className='flex items-center justify-center gap-4 mt-3'>
                  <button
                    type='button'
                    onClick={() => setSessionPage((prev) => Math.max(prev - 1, 0))}
                    disabled={sessionPage === 0}
                    className='px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed'
                  >
                    Prev
                  </button>
                  <span className='text-sm text-gray-500'>Page {sessionPage + 1} of {totalSessionPages}</span>
                  <button
                    type='button'
                    onClick={() => setSessionPage((prev) => Math.min(prev + 1, totalSessionPages - 1))}
                    disabled={sessionPage >= totalSessionPages - 1}
                    className='px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed'
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Step 3: Patient details */}
        <div>
          <p className='mb-2 font-medium text-gray-800'>3. Patient Details</p>
          <div className='flex flex-col gap-4 sm:flex-row'>
            <div className='flex flex-col flex-1 gap-1'>
              <p>Full Name</p>
              {/* <input value={name} onChange={(e) => setName(e.target.value)} className='px-3 py-2 border rounded' type='text' placeholder='Patient name' maxLength={24} required /> */}
              <input value={name} onChange={(e) => setName(filterLettersOnly(e.target.value))} className='px-3 py-2 border rounded' type='text' placeholder='Patient name' maxLength={24} required />
            </div>
            <div className='flex flex-col flex-1 gap-1'>
              <p>Phone Number</p>
              <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className='px-3 py-2 border rounded' type='tel' placeholder='07XXXXXXXX' maxLength={10} required />
            </div>
          </div>
          <div className='flex flex-col gap-4 mt-4 sm:flex-row'>
            <div className='flex flex-col flex-1 gap-1'>
              <p>Age</p>
              {/* <input value={age} onChange={(e) => setAge(e.target.value)} className='px-3 py-2 border rounded' type='number' min='1' max='120' placeholder='Age' /> */}
              <input value={age} onChange={(e) => setAge(e.target.value)} className='px-3 py-2 border rounded' type='number' placeholder='Age' />

            </div>
            <div className='flex flex-col flex-1 gap-1'>
              <p>Gender</p>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className='px-3 py-2 border rounded' required>
                <option value='Not Selected' disabled>Not Selected</option>
                <option value='Male'>Male</option>
                <option value='Female'>Female</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 4: Payment */}
        <div>
          <p className='mb-2 font-medium text-gray-800'>4. Payment</p>
          {selectedDoctor && (
            <div className='flex flex-col gap-0.5 mb-3 text-sm text-gray-500 w-fit'>
              <div className='flex justify-between gap-6'>
                <span>Consultation fee</span>
                <span>Rs {selectedDoctor.fees}</span>
              </div>
              <div className='flex justify-between gap-6'>
                <span>Hospital Charges</span>
                <span>Rs {hospitalCharge}</span>
              </div>
              <div className='flex justify-between gap-6 font-medium text-gray-700'>
                <span>Amount</span>
                <span>Rs {selectedDoctor.fees + hospitalCharge}</span>
              </div>
            </div>
          )}
          <button
            type='button'
            onClick={() => setPayment((prev) => !prev)}
            className={`px-5 py-2 rounded-full border text-sm font-medium transition-colors ${payment ? 'bg-green-500 text-white border-green-500' : 'border-gray-300 text-gray-600 hover:border-primary'}`}
          >
            {payment ? 'Paid ✓' : 'Mark as Paid'}
          </button>
        </div>

        <button type='submit' disabled={loading} className='px-10 py-3 text-sm text-white rounded-full bg-primary w-fit disabled:opacity-60'>
          {loading ? 'Booking...' : 'Book Appointment'}
        </button>

      </div>
    </form>
  )
}

export default PatientCheckIn
