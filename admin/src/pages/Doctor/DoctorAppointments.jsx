import React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useContext } from 'react'
import { CalendarDays, Download, Search, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'

const todayUTC = () => {
  const now = new Date()
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
}

const dateInputToUTC = (val) => {
  const [y, m, d] = val.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

const slotDateToUTC = (slotDate) => {
  const [d, m, y] = slotDate.split('_').map(Number)
  return Date.UTC(y, m - 1, d)
}

const QUICK_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Upcoming', value: 'upcoming' },
]

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

const DoctorAppointments = () => {

  const { dToken, appointments, getAppointments } = useContext(DoctorContext)
  const { slotDateFormat, calculateAge } = useContext(AppContext)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [specificDate, setSpecificDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const dateInputRef = useRef(null)

  useEffect(() => {
    if (dToken) {
      getAppointments()
    }
  }, [dToken])

  const today = todayUTC()

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

  const isFiltered = dateFilter !== 'all' || specificDate || statusFilter !== 'all' || search

  const resetFilters = () => {
    setDateFilter('all')
    setSpecificDate('')
    setStatusFilter('all')
    setSearch('')
    if (dateInputRef.current) dateInputRef.current.value = ''
  }

  const filteredAppointments = appointments.filter((item) => {
    if (!item.payment) return false

    const itemDay = slotDateToUTC(item.slotDate)

    if (specificDate) {
      if (itemDay !== dateInputToUTC(specificDate)) return false
    } else {
      if (dateFilter === 'today' && itemDay !== today) return false
      if (dateFilter === 'upcoming' && itemDay < today) return false
    }

    if (statusFilter === 'cancelled' && !item.cancelled) return false
    if (statusFilter === 'completed' && !(item.isCompleted && !item.cancelled)) return false
    if (statusFilter === 'pending' && !(!item.isCompleted && !item.cancelled)) return false

    const term = search.trim().toLowerCase()
    if (term && !(String(item.ref || '').includes(term) || item.userData?.name?.toLowerCase().includes(term))) return false

    return true
  }).reverse()

  const handleExport = () => {
    const header = ['Ref', 'Patient', 'Age', 'Gender', 'Date', 'Time', 'Method']
    const rows = filteredAppointments.map((item) => [
      item.ref || '-',
      item.userData.name,
      item.userData.age || calculateAge(item.userData.dob),
      item.userData.gender || 'Not Selected',
      slotDateFormat(item.slotDate),
      item.slotTime,
      item.isWalkIn ? 'Walk-in' : 'Online'
    ])

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    ws['!cols'] = [
      { wch: 10 }, // Ref
      { wch: 20 }, // Patient
      { wch: 8 },  // Age
      { wch: 12 }, // Gender
      { wch: 14 }, // Date
      { wch: 10 }, // Time
      { wch: 10 }, // Method
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Appointments')
    XLSX.writeFile(wb, `appointments-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // Pagination
  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE))
  const paginatedAppointments = filteredAppointments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  // End pagination

  useEffect(() => {
    setPage(1)
  }, [search, dateFilter, specificDate, statusFilter])

  return (
    <div className='w-full max-w-6xl m-5'>

      <p className='mb-3 text-lg font-medium'>All Appointments</p>

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

        <div className='relative w-56'>
          <Search size={14} className='absolute text-gray-400 -translate-y-1/2 left-3 top-1/2' />
          <input
            type='text'
            placeholder='Search by ref or name'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full py-1.5 pl-8 pr-8 text-sm border rounded-lg focus:outline-none focus:border-primary'
          />
          {search && (
            <button onClick={() => setSearch('')} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500'>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.4fr_0.8fr_1.6fr_0.6fr_0.9fr_1.8fr_1fr] gap-1 py-3 px-6 border-b'>
          <p>#</p>
          <p>Ref</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Gender</p>
          <p>Date & Time</p>
          <p>Method</p>
        </div>

        {paginatedAppointments.map((item, index) => (
          <div className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.4fr_0.8fr_1.6fr_0.6fr_0.9fr_1.8fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
            <p className='max-sm:hidden'>{index + 1}</p>
            <p>{item.ref || '-'}</p>
            <p>{item.userData.name}</p>
            <p className='max-sm:hidden'>{item.userData.age || calculateAge(item.userData.dob)}</p>
            <p>{item.userData.gender || 'Not Selected'}</p>
            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
            <div>
              <p className='inline px-2 text-xs border rounded-full border-primary'>
                {item.isWalkIn ? 'Walk-in' : 'Online'}
              </p>
            </div>
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

export default DoctorAppointments
