import React, { useContext, useEffect, useRef, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { Ban, CalendarDays, X } from 'lucide-react'

const todayUTC = () => {
  const now = new Date()
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
}

const dateInputToUTC = (val) => {
  const [y, m, d] = val.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

const QUICK_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Upcoming', value: 'upcoming' },
]

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Cancelled', value: 'cancelled' },
]

const DoctorSessionSchedule = () => {

  const { dToken, sessions, getSessions, cancelSession } = useContext(DoctorContext)
  const [dateFilter, setDateFilter] = useState('all')
  const [specificDate, setSpecificDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const dateInputRef = useRef(null)

  useEffect(() => {
    if (dToken) {
      getSessions()
    }
  }, [dToken])

  const today = todayUTC()

  const now = new Date()
  const todayInputValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const handleQuickPill = (value) => {
    setDateFilter(value)
    setSpecificDate('')
  }

  const handleDateInput = (e) => {
    setSpecificDate(e.target.value)
    setDateFilter('all')
  }

  const clearSpecificDate = () => {
    setSpecificDate('')
    if (dateInputRef.current) dateInputRef.current.value = ''
  }

  const isFiltered = dateFilter !== 'all' || specificDate || statusFilter !== 'all'

  const resetFilters = () => {
    setDateFilter('all')
    setSpecificDate('')
    setStatusFilter('all')
    if (dateInputRef.current) dateInputRef.current.value = ''
  }

  const upcomingSessions = sessions.filter((item) => {
    const sessionDay = new Date(item.date).setUTCHours(0, 0, 0, 0)

    // This page only covers today + upcoming — past sessions live on the separate history page
    if (sessionDay < today) return false

    if (specificDate) {
      if (sessionDay !== dateInputToUTC(specificDate)) return false
    } else {
      if (dateFilter === 'today' && sessionDay !== today) return false
      if (dateFilter === 'upcoming' && sessionDay < today) return false
    }

    if (statusFilter !== 'all' && item.status !== statusFilter) return false

    return true
  })

  return (
    <div className='w-full max-w-6xl m-5'>

      <p className='mb-3 text-lg font-medium'>My Sessions</p>

      <div className='flex flex-wrap items-center gap-3 px-5 py-3 mb-3 bg-white border rounded-xl'>
        <span className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>Date</span>
        {QUICK_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleQuickPill(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!specificDate && dateFilter === opt.value
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
          >
            {opt.label}
          </button>
        ))}

        <div className='relative flex items-center'>
          <button
            type='button'
            onClick={() => dateInputRef.current?.showPicker()}
            title='Pick a specific date'
            className={`p-1.5 rounded-lg border transition-colors ${specificDate
              ? 'border-primary/30 text-primary bg-primary/10'
              : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
              }`}
          >
            <CalendarDays size={14} />
          </button>
          <input
            ref={dateInputRef}
            type='date'
            value={specificDate}
            onChange={handleDateInput}
            min={todayInputValue}
            className='absolute w-0 h-0 opacity-0 pointer-events-none'
          />
          {specificDate && (
            <span className='ml-2 flex items-center gap-1 text-xs text-primary border border-primary/30 bg-primary/10 rounded-lg px-2.5 py-1 font-medium'>
              {new Date(specificDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              <button onClick={clearSpecificDate} className='transition-colors hover:text-red-400'>
                <X size={11} />
              </button>
            </span>
          )}
        </div>

        <div className='w-px h-5 bg-gray-200' />

        <span className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>Status</span>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${statusFilter === opt.value
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
          >
            {opt.label}
          </button>
        ))}

        {isFiltered && (
          <button
            onClick={resetFilters}
            className='flex items-center gap-1 ml-auto text-xs text-gray-400 transition-colors hover:text-red-400'
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_1.5fr_1fr_1fr_1fr_1fr_1fr_0.5fr] gap-1 py-3 px-6 border-b'>
          <p>#</p>
          <p>Date</p>
          <p>Start Time</p>
          <p>End Time</p>
          <p>Max Patients</p>
          <p>Booked</p>
          <p>Status</p>
          <p>Action</p>
        </div>

        {upcomingSessions.length === 0
          ? <p className='p-6 text-gray-500'>No sessions found</p>
          : upcomingSessions.map((item, index) => (
            <div className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_1.5fr_1fr_1fr_1fr_1fr_1fr_0.5fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={item._id}>
              <p className='max-sm:hidden'>{index + 1}</p>
              <p>{new Date(item.date).toLocaleDateString('en-GB')}</p>
              <p>{item.startTime}</p>
              <p>{item.endTime || '-'}</p>
              <p>{item.maxPatients}</p>
              <p>{item.bookedPatientsCount}</p>
              <p className={`text-xs font-medium ${item.status === 'cancelled' ? 'text-red-500' : 'text-green-600'}`}>
                {item.status}
              </p>
              {item.bookedPatientsCount > 0 || item.status === 'cancelled'
                ? <p className='text-xs text-gray-400'>-</p>
                : <Ban onClick={() => cancelSession(item._id)} title='Cancel session' className='w-4 text-red-500 cursor-pointer hover:text-red-700' />
              }
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default DoctorSessionSchedule
