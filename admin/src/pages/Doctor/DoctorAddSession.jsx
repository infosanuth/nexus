import React, { useContext, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { toast } from 'react-toastify'

const DoctorAddSession = () => {

  const { addSession } = useContext(DoctorContext)

  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [maxPatients, setMaxPatients] = useState('')

  const todayStr = new Date().toLocaleDateString('en-CA')

  const onSubmitHandler = async (event) => {
    event.preventDefault()

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

    const sessionData = {
      date,
      startTime,
      endTime,
      maxPatients: Number(maxPatients)
    }

    const success = await addSession(sessionData)

    if (success) {
      setDate('')
      setStartTime('')
      setEndTime('')
      setMaxPatients('')
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='m-5 w-full'>

      <p className='mb-3 text-lg font-medium'>Add Session</p>

      <div className='bg-white px-8 py-8 border rounded w-full max-w-2xl'>
        <div className='flex flex-col gap-4 text-gray-600'>

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

        </div>

        <button type='submit' className='bg-[#64748B] px-10 py-3 mt-6 text-white rounded-full'>Add Session</button>

      </div>
    </form>
  )
}

export default DoctorAddSession
