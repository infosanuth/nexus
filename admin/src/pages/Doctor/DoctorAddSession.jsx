import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { toast } from 'react-toastify'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const DoctorAddSession = () => {

  const { addSession } = useContext(DoctorContext)

  const [mode, setMode] = useState('single') // 'single' | 'multiple'

  const todayStr = new Date().toLocaleDateString('en-CA')
  const currentYear = new Date().getFullYear()

  // ----- Quick (single day) session state -----
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [maxPatients, setMaxPatients] = useState('')

  // ----- Multiple session state -----
  const [multiYear, setMultiYear] = useState(String(currentYear))
  const [multiMonth, setMultiMonth] = useState('')
  const [multiWeekday, setMultiWeekday] = useState('')
  const [multiStartTime, setMultiStartTime] = useState('')
  const [multiEndTime, setMultiEndTime] = useState('')
  const [multiMaxPatients, setMultiMaxPatients] = useState('')
  const [generatedDates, setGeneratedDates] = useState([])

  // Regenerate matching dates whenever year / month / weekday changes
  useEffect(() => {
    if (multiMonth === '' || multiWeekday === '') {
      setGeneratedDates([])
      return
    }

    const year = Number(multiYear)
    const month = Number(multiMonth)
    const weekday = Number(multiWeekday)

    const dates = []
    const cursor = new Date(year, month, 1)
    while (cursor.getMonth() === month) {
      if (cursor.getDay() === weekday) {
        const dateStr = cursor.toLocaleDateString('en-CA')
        if (dateStr >= todayStr) {
          dates.push({ date: dateStr, day: cursor.getDate(), selected: true })
        }
      }
      cursor.setDate(cursor.getDate() + 1)
    }
    setGeneratedDates(dates)
  }, [multiYear, multiMonth, multiWeekday])

  const toggleGeneratedDate = (dateStr) => {
    setGeneratedDates(prev => prev.map(d => d.date === dateStr ? { ...d, selected: !d.selected } : d))
  }

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

  const onMultiSubmitHandler = async (event) => {
    event.preventDefault()

    const selectedDates = generatedDates.filter(d => d.selected)

    if (selectedDates.length === 0) {
      return toast.error('Select at least one date')
    }

    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    if (selectedDates.some(d => d.date === todayStr && multiStartTime < currentTime)) {
      return toast.error('Cannot add a session for a past time')
    }

    if (multiEndTime && multiEndTime <= multiStartTime) {
      return toast.error('End time must be after start time')
    }

    if (Number(multiMaxPatients) <= 0) {
      return toast.error('Max patients must be greater than 0')
    }

    let successCount = 0
    for (const d of selectedDates) {
      const success = await addSession({
        date: d.date,
        startTime: multiStartTime,
        endTime: multiEndTime,
        maxPatients: Number(multiMaxPatients)
      })
      if (success) successCount++
    }

    if (successCount === selectedDates.length) {
      setMultiMonth('')
      setMultiWeekday('')
      setMultiStartTime('')
      setMultiEndTime('')
      setMultiMaxPatients('')
      setGeneratedDates([])
    }
  }

  return (
    <div className='m-5 w-full'>

      <p className='mb-3 text-lg font-medium'>Add Session</p>

      <div className='inline-flex p-1 mb-4 bg-gray-100 rounded-lg'>
        <button
          type='button'
          onClick={() => setMode('single')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'single' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Quick Session
        </button>
        <button
          type='button'
          onClick={() => setMode('multiple')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'multiple' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Multiple Sessions
        </button>
      </div>

      {mode === 'single' && (
        <form onSubmit={onSubmitHandler}>
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
      )}

      {mode === 'multiple' && (
        <form onSubmit={onMultiSubmitHandler}>
          <div className='bg-white px-8 py-8 border rounded w-full max-w-2xl'>
            <div className='flex flex-col gap-4 text-gray-600'>

              <div className='flex flex-col sm:flex-row gap-4'>
                <div className='flex-1 flex flex-col gap-1'>
                  <p>Month</p>
                  <select onChange={(e) => setMultiMonth(e.target.value)} value={multiMonth} className='border rounded px-3 py-2' required>
                    <option value='' disabled>Select month</option>
                    {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                  </select>
                </div>

                <div className='flex-1 flex flex-col gap-1'>
                  <p>Year</p>
                  <select onChange={(e) => setMultiYear(e.target.value)} value={multiYear} className='border rounded px-3 py-2' required>
                    <option value={currentYear}>{currentYear}</option>
                    <option value={currentYear + 1}>{currentYear + 1}</option>
                  </select>
                </div>

                <div className='flex-1 flex flex-col gap-1'>
                  <p>Weekday</p>
                  <select onChange={(e) => setMultiWeekday(e.target.value)} value={multiWeekday} className='border rounded px-3 py-2' required>
                    <option value='' disabled>Select day</option>
                    {WEEKDAYS.map((w, i) => <option key={w} value={i}>{w}</option>)}
                  </select>
                </div>
              </div>

              <div className='flex flex-col sm:flex-row gap-4'>
                <div className='flex-1 flex flex-col gap-1'>
                  <p>Start Time</p>
                  <input onChange={(e) => setMultiStartTime(e.target.value)} value={multiStartTime} className='border rounded px-3 py-2' type='time' required />
                </div>

                <div className='flex-1 flex flex-col gap-1'>
                  <p>End Time</p>
                  <input onChange={(e) => setMultiEndTime(e.target.value)} value={multiEndTime} className='border rounded px-3 py-2' type='time' />
                </div>
              </div>

              <div className='flex-1 flex flex-col gap-1'>
                <p>Max Patients</p>
                <input onChange={(e) => setMultiMaxPatients(e.target.value)} value={multiMaxPatients} className='border rounded px-3 py-2' type='number' min='1' placeholder='e.g. 10' required />
              </div>

              {generatedDates.length > 0 && (
                <div className='flex-1 flex flex-col gap-2'>
                  <p>{WEEKDAYS[multiWeekday]}s in {MONTHS[multiMonth]} {multiYear} — click to unselect</p>
                  <div className='flex flex-wrap gap-2'>
                    {generatedDates.map(d => (
                      <button
                        key={d.date}
                        type='button'
                        onClick={() => toggleGeneratedDate(d.date)}
                        title={d.date}
                        className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${d.selected
                          ? 'bg-green-50 text-green-600 border-green-300'
                          : 'bg-red-50 text-red-500 border-red-200'}`}
                      >
                        {d.day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {multiMonth !== '' && multiWeekday !== '' && generatedDates.length === 0 && (
                <p className='text-sm text-gray-400'>No upcoming {WEEKDAYS[multiWeekday]}s left in {MONTHS[multiMonth]} {multiYear}.</p>
              )}

            </div>

            <button type='submit' className='bg-[#64748B] px-10 py-3 mt-6 text-white rounded-full'>Add Sessions</button>

          </div>
        </form>
      )}

    </div>
  )
}

export default DoctorAddSession
