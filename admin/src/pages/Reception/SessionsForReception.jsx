import React, { useContext, useEffect, useState } from 'react'
import { ReceptionContext } from '../../context/ReceptionContext'

const convertTo12Hour = (time24) => {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
}

const formatSessionDate = (date) => {
  const d = new Date(date)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

const todayUTC = () => {
  const now = new Date()
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
}

const DATE_OPTIONS = [
  { label: 'All Dates', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Past', value: 'past' },
]

const STATUS_OPTIONS = [
  { label: 'All Status', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Available', value: 'available' },
  { label: 'Cancelled', value: 'cancelled' },
]

const SessionsForReception = () => {

  const { rToken, sessions, getSessions } = useContext(ReceptionContext)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (rToken) {
      getSessions()
    }
  }, [rToken])

  const today = todayUTC()

  const isFiltered = search.trim() || dateFilter !== 'all' || statusFilter !== 'all'

  const resetFilters = () => {
    setSearch('')
    setDateFilter('all')
    setStatusFilter('all')
  }

  const filtered = sessions.filter((s) => {
    const sessionDay = new Date(s.date).setUTCHours(0, 0, 0, 0)
    const isPast = sessionDay < today
    const isFull = s.bookedPatientsCount >= s.maxPatients

    if (search.trim() && !s.doctorName.toLowerCase().includes(search.trim().toLowerCase())) return false

    if (dateFilter === 'today' && sessionDay !== today) return false
    if (dateFilter === 'upcoming' && sessionDay < today) return false
    if (dateFilter === 'past' && !isPast) return false

    if (statusFilter === 'cancelled' && s.status !== 'cancelled') return false
    if (statusFilter === 'active' && (s.status === 'cancelled' || isPast || isFull)) return false
    if (statusFilter === 'available' && (isFull || s.status === 'cancelled')) return false

    return true
  })

  return (
    <div className='w-full max-w-6xl m-5'>

      {/* Title + Search */}
      <div className='flex items-center justify-between mb-3'>
        <p className='text-lg font-medium'>Doctor Sessions</p>
        <input
          type='text'
          placeholder='Search by doctor name...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='border rounded px-3 py-1.5 text-sm w-64 focus:outline-none focus:border-primary'
        />
      </div>

      {/* Filters row */}
      <div className='flex flex-wrap items-center gap-3 mb-3'>
        <div className='flex items-center gap-2'>
          <label className='text-sm text-gray-500'>Date:</label>
          <div className='flex gap-1'>
            {DATE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDateFilter(opt.value)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  dateFilter === opt.value
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-300 text-gray-600 hover:border-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <label className='text-sm text-gray-500'>Status:</label>
          <div className='flex gap-1'>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  statusFilter === opt.value
                    ? 'bg-primary text-white border-primary'
                    : 'border-gray-300 text-gray-600 hover:border-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {isFiltered && (
          <button
            onClick={resetFilters}
            className='ml-auto text-xs text-gray-400 hover:text-red-400 underline'
          >
            Clear filters
          </button>
        )}
      </div>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>

        {/* Header */}
        <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_2fr_2fr_1fr_1fr_1fr_1fr] gap-1 py-3 px-6 border-b font-medium text-gray-700'>
          <p>#</p>
          <p>Doctor</p>
          <p>Date</p>
          <p>Time</p>
          <p>Max</p>
          <p>Booked</p>
          <p>Available</p>
          <p>Status</p>
        </div>

        {filtered.length === 0 ? (
          <p className='py-6 text-center text-gray-400'>No sessions found</p>
        ) : (
          filtered.map((item, index) => {
            const available = item.maxPatients - item.bookedPatientsCount
            const isFull = available <= 0
            const sessionDay = new Date(item.date).setUTCHours(0, 0, 0, 0)
            const isPast = sessionDay < today

            return (
              <div
                key={item._id}
                className='flex flex-wrap justify-between max-sm:gap-2 sm:grid grid-cols-[0.5fr_2fr_2fr_2fr_1fr_1fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'
              >
                <p className='max-sm:hidden'>{index + 1}</p>
                <p className='font-medium text-gray-700'>{item.doctorName}</p>
                <p>{formatSessionDate(item.date)}</p>
                <p>
                  {convertTo12Hour(item.startTime)}
                  {item.endTime ? ` – ${convertTo12Hour(item.endTime)}` : ''}
                </p>
                <p>{item.maxPatients}</p>
                <p>{item.bookedPatientsCount}</p>
                <p className={isFull ? 'text-red-500 font-medium' : 'text-green-600 font-medium'}>
                  {isFull ? 'Full' : available}
                </p>
                <p>
                  {item.status === 'cancelled'
                    ? <span className='text-xs font-medium text-red-400'>Cancelled</span>
                    : isPast
                      ? <span className='text-xs font-medium text-gray-400'>Past</span>
                      : isFull
                        ? <span className='text-xs font-medium text-orange-500'>Full</span>
                        : <span className='text-xs font-medium text-green-500'>Active</span>
                  }
                </p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default SessionsForReception
