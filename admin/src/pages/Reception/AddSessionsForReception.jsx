import React, { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { ReceptionContext } from '../../context/ReceptionContext'

const AddSessionsForReception = () => {

  const { backendUrl, addSession } = useContext(ReceptionContext)

  const [specialities, setSpecialities] = useState([])
  const [doctors, setDoctors] = useState([])
  const [filteredDoctors, setFilteredDoctors] = useState([])

  const [speciality, setSpeciality] = useState('')
  const [docId, setDocId] = useState('')

  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [maxPatients, setMaxPatients] = useState('')

  const [loading, setLoading] = useState(false)

  const todayStr = new Date().toLocaleDateString('en-CA')

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

  useEffect(() => {
    getSpecialities()
    getDoctors()
  }, [])

  useEffect(() => {
    setFilteredDoctors(speciality ? doctors.filter(doc => doc.speciality === speciality) : doctors)
    setDocId('')
  }, [speciality, doctors])

  const resetForm = () => {
    setSpeciality('')
    setDocId('')
    setDate('')
    setStartTime('')
    setEndTime('')
    setMaxPatients('')
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    if (!docId) return toast.error('Please select a doctor')

    if (date < todayStr) {
      return toast.error('Cannot add a session for a past date')
    }

    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    if (date === todayStr && startTime < currentTime) {
      return toast.error('Cannot add a session for a past time')
    }

    if (endTime && endTime <= startTime) {
      return toast.error('End time must be after start time')
    }

    if (Number(maxPatients) <= 0) {
      return toast.error('Max patients must be greater than 0')
    }

    setLoading(true)
    try {
      const success = await addSession({
        docId,
        date,
        startTime,
        endTime,
        maxPatients: Number(maxPatients)
      })

      if (success) {
        resetForm()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='m-5 w-full'>

      <p className='mb-3 text-lg font-medium'>Add Session</p>

      <div className='bg-white px-8 py-8 border rounded w-full max-w-2xl flex flex-col gap-4 text-gray-600'>

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

        <div className='flex-1 flex flex-col gap-1'>
          <p>Date</p>
          <input onChange={(e) => setDate(e.target.value)} value={date} className='border rounded px-3 py-2' type='date' min={todayStr} required />
        </div>

        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='flex-1 flex flex-col gap-1'>
            <p>Start Time</p>
            <input onChange={(e) => setStartTime(e.target.value)} value={startTime} className='border rounded px-3 py-2' type='time' required />
          </div>

          <div className='flex-1 flex flex-col gap-1'>
            <p>End Time</p>
            <input onChange={(e) => setEndTime(e.target.value)} value={endTime} className='border rounded px-3 py-2' type='time' />
          </div>
        </div>

        <div className='flex-1 flex flex-col gap-1'>
          <p>Max Patients</p>
          <input onChange={(e) => setMaxPatients(e.target.value)} value={maxPatients} className='border rounded px-3 py-2' type='number' min='1' placeholder='e.g. 10' required />
        </div>

        <button type='submit' disabled={loading} className='bg-primary text-white text-sm px-10 py-3 rounded-full w-fit mt-2 disabled:opacity-60'>
          {loading ? 'Adding...' : 'Add Session'}
        </button>

      </div>
    </form>
  )
}

export default AddSessionsForReception
