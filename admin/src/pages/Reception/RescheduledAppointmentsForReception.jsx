import React, { useContext, useEffect, useRef, useState } from 'react'
import { CalendarDays, Download, Search, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { ReceptionContext } from '../../context/ReceptionContext'
import { AppContext } from '../../context/AppContext'
import { dateInputToUTC } from '../../utils/date'

const slotDateToUTC = (slotDate) => {
  const [d, m, y] = slotDate.split('_').map(Number)
  return Date.UTC(y, m - 1, d)
}

const RescheduledAppointmentsForReception = () => {

  const { rToken, appointments, getAppointments } = useContext(ReceptionContext)
  const { slotDateFormat } = useContext(AppContext)
  const [patientSearch, setPatientSearch] = useState('')
  const [doctorSearch, setDoctorSearch] = useState('')
  const [specificDate, setSpecificDate] = useState('')
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false)
  const doctorDropdownRef = useRef(null)
  const dateInputRef = useRef(null)

  useEffect(() => {
    if (rToken) {
      getAppointments()
    }
  }, [rToken])

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

  const handleDateInput = (e) => {
    setSpecificDate(e.target.value)
  }

  const clearSpecificDate = () => {
    setSpecificDate('')
    if (dateInputRef.current) dateInputRef.current.value = ''
  }

  const isFiltered = specificDate || patientSearch || doctorSearch

  const resetFilters = () => {
    setSpecificDate('')
    setPatientSearch('')
    setDoctorSearch('')
    if (dateInputRef.current) dateInputRef.current.value = ''
  }

  // Only appointments that have actually been rescheduled carry a previous slot
  const rescheduled = appointments.filter((item) => item.reSchedule && item.previousSlotDate)

  const doctorNames = [...new Set(rescheduled.map((item) => item.docData?.name?.trim()).filter(Boolean))].sort()
  const doctorSearchResults = doctorNames.filter((name) => name.toLowerCase().includes(doctorSearch.trim().toLowerCase()))

  const filtered = rescheduled.filter((item) => {
    const patientTerm = patientSearch.trim().toLowerCase()
    if (patientTerm && !(String(item.ref || '').toLowerCase().includes(patientTerm) || item.userData?.name?.toLowerCase().includes(patientTerm))) return false

    const doctorTerm = doctorSearch.trim().toLowerCase()
    if (doctorTerm && !item.docData?.name?.toLowerCase().includes(doctorTerm)) return false

    // "New Date" filter — matches the rescheduled-to slot date
    if (specificDate && slotDateToUTC(item.slotDate) !== dateInputToUTC(specificDate)) return false

    return true
  })

  const sorted = [...filtered].reverse()

  const handleExport = () => {
    const header = ['Ref', 'Patient', 'Doctor', 'Previous Date & Time', 'New Date & Time', 'Status']
    const rows = sorted.map((item) => [
      item.ref || '-',
      item.userData?.name || 'N/A',
      item.docData?.name || 'N/A',
      `${slotDateFormat(item.previousSlotDate)}, ${item.previousSlotTime}`,
      `${slotDateFormat(item.slotDate)}, ${item.slotTime}`,
      item.cancelled ? 'Cancelled' : item.isCompleted ? 'Completed' : 'Pending'
    ])

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    ws['!cols'] = [
      { wch: 10 }, // Ref
      { wch: 20 }, // Patient
      { wch: 18 }, // Doctor
      { wch: 22 }, // Previous Date & Time
      { wch: 22 }, // New Date & Time
      { wch: 12 }, // Status
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Rescheduled Appointments')
    XLSX.writeFile(wb, `rescheduled-appointments-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // Pagination
  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  // End pagination

  useEffect(() => {
    setPage(1)
  }, [patientSearch, doctorSearch, specificDate])

  return (
    <div className='w-full max-w-6xl m-5'>

      <p className='mb-3 text-lg font-medium'>Rescheduled Appointments</p>

      <div className='flex flex-wrap items-center gap-3 px-5 py-3 mb-3 bg-white border rounded-xl'>
        <div className='flex items-center gap-2 shrink-0'>
          <span className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>New Date</span>
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
              <span className='ml-2 flex items-center gap-1 text-xs text-primary border border-primary/30 bg-primary/10 rounded-lg px-2.5 py-1 font-medium whitespace-nowrap'>
                {new Date(specificDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                <button onClick={clearSpecificDate} className='transition-colors hover:text-red-400'>
                  <X size={11} />
                </button>
              </span>
            )}
          </div>
        </div>

        {isFiltered && (
          <button
            onClick={resetFilters}
            className='flex items-center gap-1 text-xs text-gray-400 transition-colors shrink-0 whitespace-nowrap hover:text-red-400'
          >
            <X size={12} /> Clear
          </button>
        )}

        <div className='flex items-center gap-3 ml-auto shrink-0'>
          <div className='relative w-56'>
            <Search size={14} className='absolute text-gray-400 -translate-y-1/2 left-3 top-1/2' />
            <input
              type='text'
              placeholder='Search by ref or patient...'
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              className='w-full py-1.5 pl-8 pr-8 text-sm border rounded-lg focus:outline-none focus:border-primary'
            />
            {patientSearch && (
              <button onClick={() => setPatientSearch('')} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500'>
                <X size={13} />
              </button>
            )}
          </div>

          <div className='relative w-56' ref={doctorDropdownRef}>
            <Search size={14} className='absolute text-gray-400 -translate-y-1/2 left-3 top-1/2' />
            <input
              type='text'
              placeholder='Search by doctor...'
              value={doctorSearch}
              onChange={(e) => setDoctorSearch(e.target.value)}
              onFocus={() => setIsDoctorDropdownOpen(true)}
              className='w-full py-1.5 pl-8 pr-8 text-sm border rounded-lg focus:outline-none focus:border-primary'
              autoComplete='off'
            />
            {doctorSearch && (
              <button onClick={() => { setDoctorSearch(''); setIsDoctorDropdownOpen(false) }} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500'>
                <X size={13} />
              </button>
            )}
            {isDoctorDropdownOpen && doctorSearchResults.length > 0 && (
              <div className='absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border rounded-lg shadow-lg z-10'>
                {doctorSearchResults.map((name) => (
                  <button
                    key={name}
                    type='button'
                    onClick={() => { setDoctorSearch(name); setIsDoctorDropdownOpen(false) }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${doctorSearch === name ? 'bg-primary/10 text-primary' : ''}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleExport}
            className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors bg-white border rounded-lg hover:border-gray-300 hover:text-gray-800'
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_1fr_2fr_2fr_2fr_2fr_1fr] gap-1 py-3 px-6 border-b font-medium'>
          <p>#</p>
          <p>Ref</p>
          <p>Patient</p>
          <p>Doctor</p>
          <p>Previous Date & Time</p>
          <p>New Date & Time</p>
          <p>Status</p>
        </div>

        {sorted.length === 0 ? (
          <p className='py-6 text-center text-gray-400'>No rescheduled appointments found</p>
        ) : (
          paginated.map((item, index) => (
            <div
              className='flex flex-wrap justify-between max-sm:gap-2 max-sm:text-base sm:grid grid-cols-[0.5fr_1fr_2fr_2fr_2fr_2fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'
              key={item._id}
            >
              <p className='max-sm:hidden'>{(page - 1) * PAGE_SIZE + index + 1}</p>
              <p>{item.ref || '-'}</p>
              <p>{item.userData?.name || 'N/A'}</p>
              <p>{item.docData?.name || 'N/A'}</p>
              <p className='text-red-400 line-through decoration-red-300'>
                {slotDateFormat(item.previousSlotDate)}, {item.previousSlotTime}
              </p>
              <p className='font-medium text-gray-700'>
                {slotDateFormat(item.slotDate)}, {item.slotTime}
              </p>
              {item.cancelled
                ? <p className='text-xs font-medium text-red-400'>Cancelled</p>
                : item.isCompleted
                  ? <p className='text-xs font-medium text-green-500'>Completed</p>
                  : <p className='text-xs font-medium text-blue-500'>Pending</p>
              }
            </div>
          ))
        )}
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

export default RescheduledAppointmentsForReception
