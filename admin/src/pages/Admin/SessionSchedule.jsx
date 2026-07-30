import React, { useContext, useEffect, useRef, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { CalendarDays, Download, Search, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { todayUTC, dateInputToUTC } from '../../utils/date'

const QUICK_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Upcoming', value: 'upcoming' },
]

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Cancelled', value: 'cancelled' },
]

const SessionSchedule = () => {

  const { aToken, sessions, getSessions } = useContext(AdminContext)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [specificDate, setSpecificDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const dateInputRef = useRef(null)

  useEffect(() => {
    if (aToken) {
      getSessions()
    }
  }, [aToken])

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

  const isFiltered = search.trim() || dateFilter !== 'all' || specificDate || statusFilter !== 'all'

  const resetFilters = () => {
    setSearch('')
    setDateFilter('all')
    setSpecificDate('')
    setStatusFilter('all')
    if (dateInputRef.current) dateInputRef.current.value = ''
  }

  const upcomingSessions = sessions.filter((item) => {
    const sessionDay = new Date(item.date).setUTCHours(0, 0, 0, 0)

    // This page only covers today + upcoming — past sessions live on the separate history page
    if (sessionDay < today) return false

    if (search.trim() && !item.doctorName.toLowerCase().includes(search.trim().toLowerCase())) return false

    if (specificDate) {
      if (sessionDay !== dateInputToUTC(specificDate)) return false
    } else {
      if (dateFilter === 'today' && sessionDay !== today) return false
      if (dateFilter === 'upcoming' && sessionDay < today) return false
    }

    if (statusFilter !== 'all' && item.status !== statusFilter) return false

    return true
  }).sort((a, b) => new Date(a.date) - new Date(b.date))

  const handleExport = () => {
    const header = ['Doctor', 'Date', 'Start Time', 'End Time', 'Max Patients', 'Booked', 'Status']
    const rows = upcomingSessions.map((item) => [
      item.doctorName,
      new Date(item.date).toLocaleDateString('en-GB'),
      item.startTime,
      item.endTime || '-',
      item.maxPatients,
      item.bookedPatientsCount,
      item.status
    ])

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    ws['!cols'] = [
      { wch: 20 }, // Doctor
      { wch: 12 }, // Date
      { wch: 12 }, // Start Time
      { wch: 12 }, // End Time
      { wch: 14 }, // Max Patients
      { wch: 10 }, // Booked
      { wch: 10 }, // Status
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sessions')
    XLSX.writeFile(wb, `session-schedule-${todayInputValue}.xlsx`)
  }

  // Pagination
  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(upcomingSessions.length / PAGE_SIZE))
  const paginatedSessions = upcomingSessions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  // End pagination

  return (
    <div className='w-full max-w-6xl m-5'>

      <p className='mb-3 text-lg font-medium'>Session Schedule</p>

      <div className='flex flex-wrap items-center gap-3 px-5 py-3 mb-3 bg-white border rounded-xl'>
        <div className='relative'>
          <Search size={14} className='absolute text-gray-400 -translate-y-1/2 left-2.5 top-1/2' />
          <input
            type='text'
            placeholder='Search doctor...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='py-1.5 pl-7 pr-2 text-xs transition-colors border border-gray-200 rounded-lg w-44 focus:outline-none focus:border-primary'
          />
        </div>

        <div className='w-px h-5 bg-gray-200' />

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
            className='flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-red-400'
          >
            <X size={12} /> Clear
          </button>
        )}

        <button
          onClick={handleExport}
          className='flex items-center gap-1.5 px-3 py-1.5 ml-auto text-xs font-medium text-gray-600 transition-colors border rounded-lg hover:border-gray-300 hover:text-gray-800'
        >
          <Download size={14} /> Export
        </button>
      </div>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_1.5fr_1.3fr_1fr_1fr_1fr_1fr_1fr] gap-1 py-3 px-6 border-b'>
          <p>#</p>
          <p>Doctor</p>
          <p>Date</p>
          <p>Start Time</p>
          <p>End Time</p>
          <p className='text-center'>Max Patients</p>
          <p className='text-center'>Booked</p>
          <p>Status</p>
        </div>

        {paginatedSessions.length === 0
          ? <p className='p-6 text-gray-500'>No sessions found</p>
          : paginatedSessions.map((item, index) => (
            <div className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_1.5fr_1.3fr_1fr_1fr_1fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b' key={item._id}>
              <p className='max-sm:hidden'>{index + 1}</p>
              <p>{item.doctorName}</p>
              <p>{new Date(item.date).toLocaleDateString('en-GB')}</p>
              <p>{item.startTime}</p>
              <p>{item.endTime || '-'}</p>
              <p className='text-center'>{item.maxPatients}</p>
              <p className='text-center'>{item.bookedPatientsCount}</p>
              <p className={`text-xs font-medium ${item.status === 'cancelled' ? 'text-red-500' : 'text-green-600'}`}>
                {item.status}
              </p>
            </div>
          ))
        }
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className='flex items-center justify-end gap-3 px-2 pt-4'>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className='px-3 py-1 text-xs font-medium text-gray-600 transition-colors bg-white border rounded-lg hover:border-gray-300 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed'>Prev</button>
          <span className='text-xs font-medium text-gray-400'>Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className='px-3 py-1 text-xs font-medium text-gray-600 transition-colors bg-white border rounded-lg hover:border-gray-300 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed'>Next</button>
        </div>
      )}
    </div>
  )
}

export default SessionSchedule
