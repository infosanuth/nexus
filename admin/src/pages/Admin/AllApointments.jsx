import React, { useContext, useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, ChevronDown, Clock, Download, Search, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { dateInputToUTC, getPeriodStartUTC, PERIOD_OPTIONS } from '../../utils/date'

const slotDateToUTC = (slotDate) => {
  const [d, m, y] = slotDate.split('_').map(Number)
  return Date.UTC(y, m - 1, d)
}

const TYPE_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Walk-in', value: 'walkin' },
  { label: 'Online', value: 'online' },
]

const PAYMENT_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Paid', value: 'paid' },
  { label: 'Unpaid', value: 'unpaid' },
]

const STATUS_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
]

const AllApointments = () => {

  const { aToken, appointments, getAllAppointments } = useContext(AdminContext)
  const { slotDateFormat, currency  } = useContext(AppContext)
  const [search, setSearch] = useState('')
  const [doctorSearch, setDoctorSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [specificDate, setSpecificDate] = useState('')
  const [period, setPeriod] = useState('all')
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false)
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false)
  const doctorDropdownRef = useRef(null)
  const dateInputRef = useRef(null)
  const periodDropdownRef = useRef(null)

  useEffect(() => {
    if (aToken) {
      getAllAppointments()
    }
  }, [aToken])

  // Close the doctor search / period dropdowns when clicking outside of them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (doctorDropdownRef.current && !doctorDropdownRef.current.contains(event.target)) {
        setIsDoctorDropdownOpen(false)
      }
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target)) {
        setIsPeriodDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const doctorNames = [...new Set(appointments.map((item) => item.docData?.name?.trim()).filter(Boolean))].sort()
  const doctorSearchResults = doctorNames.filter((name) => name.toLowerCase().includes(doctorSearch.trim().toLowerCase()))

  const filtered = appointments.filter((item) => {
    const term = search.trim().toLowerCase()
    const matchesSearch = !term || (
      String(item.ref || '').toLowerCase().includes(term) ||
      item.userData?.name?.toLowerCase().includes(term) ||
      item.userData?.phoneNumber?.toLowerCase().includes(term) ||
      item.userData?.phone?.toLowerCase().includes(term)
    )

    const doctorTerm = doctorSearch.trim().toLowerCase()
    const matchesDoctor = !doctorTerm || item.docData?.name?.toLowerCase().includes(doctorTerm)

    const matchesType = typeFilter === 'all' || (typeFilter === 'walkin' ? item.isWalkIn : !item.isWalkIn)

    const matchesPayment = paymentFilter === 'all' || (paymentFilter === 'paid' ? item.payment : !item.payment)

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'cancelled' && item.cancelled) ||
      (statusFilter === 'completed' && item.isCompleted && !item.cancelled) ||
      (statusFilter === 'pending' && !item.isCompleted && !item.cancelled)

    const matchesDate = !specificDate || slotDateToUTC(item.slotDate) === dateInputToUTC(specificDate)

    const periodStart = getPeriodStartUTC(period)
    const matchesPeriod = periodStart === null || slotDateToUTC(item.slotDate) >= periodStart

    return matchesSearch && matchesDoctor && matchesType && matchesPayment && matchesStatus && matchesDate && matchesPeriod
  })

  // Pagination
  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)
  const reversedFiltered = [...filtered].reverse()
  const totalPages = Math.max(1, Math.ceil(reversedFiltered.length / PAGE_SIZE))
  const paginatedAppointments = reversedFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  // End pagination

  useEffect(() => {
    setPage(1)
  }, [search, doctorSearch, typeFilter, paymentFilter, statusFilter, specificDate, period])

  const clearSpecificDate = () => {
    setSpecificDate('')
    if (dateInputRef.current) dateInputRef.current.value = ''
  }

  const isFiltered = typeFilter !== 'all' || paymentFilter !== 'all' || statusFilter !== 'all' || specificDate || search || doctorSearch || period !== 'all'

  const resetFilters = () => {
    setTypeFilter('all')
    setPaymentFilter('all')
    setStatusFilter('all')
    setSearch('')
    setDoctorSearch('')
    setPeriod('all')
    clearSpecificDate()
  }

  const handleExport = () => {
    const header = ['Ref', 'Patient', 'Phone', 'Doctor', 'Type', 'Date', 'Time', 'Payment', 'Status']
    const rows = reversedFiltered.map((item) => [
      item.ref || '-',
      item.userData?.name || 'N/A',
      item.userData?.phoneNumber || item.userData?.phone || '-',
      item.docData?.name || 'N/A',
      item.isWalkIn ? 'Walk-in' : 'Online',
      slotDateFormat(item.slotDate),
      item.slotTime,
      item.payment ? 'Paid' : 'Unpaid',
      item.cancelled ? 'Cancelled' : item.isCompleted ? 'Completed' : 'Pending'
    ])

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    ws['!cols'] = [
      { wch: 10 }, // Ref
      { wch: 20 }, // Patient
      { wch: 14 }, // Phone
      { wch: 20 }, // Doctor
      { wch: 10 }, // Type
      { wch: 14 }, // Date
      { wch: 10 }, // Time
      { wch: 10 }, // Payment
      { wch: 12 }, // Status
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Appointments')
    XLSX.writeFile(wb, `appointments-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className='w-full max-w-6xl m-5'>

      <div className='flex flex-wrap items-center justify-between gap-3 mb-3'>
        <p className='text-lg font-medium'>All Appointments</p>
        <div className='flex items-center gap-3'>
          <div className='relative w-64'>
            <Search size={14} className='absolute text-gray-400 -translate-y-1/2 left-3 top-1/2' />
            <input
              type='text'
              placeholder='Search by ref, patient, or phone...'
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
          <div className='relative w-48' ref={doctorDropdownRef}>
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
            className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors border rounded-lg shrink-0 hover:border-gray-300 hover:text-gray-800'
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-3 px-5 py-3 mb-3 bg-white border rounded-xl'>
        <div className='flex items-center gap-2 shrink-0'>
          <span className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>Date</span>
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
              onChange={(e) => setSpecificDate(e.target.value)}
              className='absolute w-0 h-0 opacity-0 pointer-events-none'
            />
            {specificDate && (
              <span className='flex items-center gap-1 px-2.5 py-1 ml-2 text-xs font-medium border rounded-lg whitespace-nowrap text-primary border-primary/30 bg-primary/10'>
                {new Date(specificDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                <button onClick={clearSpecificDate} className='transition-colors hover:text-red-400'>
                  <X size={11} />
                </button>
              </span>
            )}
          </div>
        </div>

        <div className='w-px h-5 bg-gray-200 shrink-0' />

        <div className='flex items-center gap-2 shrink-0'>
          <span className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>Type</span>
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${typeFilter === opt.value
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className='w-px h-5 bg-gray-200 shrink-0' />

        <div className='flex items-center gap-2 shrink-0'>
          <span className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>Payment</span>
          {PAYMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPaymentFilter(opt.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${paymentFilter === opt.value
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className='w-px h-5 bg-gray-200 shrink-0' />

        <div className='flex items-center gap-2 shrink-0'>
          <span className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>Status</span>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${statusFilter === opt.value
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className='w-px h-5 bg-gray-200 shrink-0' />

        <div className='relative shrink-0' ref={periodDropdownRef}>
          <button
            type='button'
            onClick={() => setIsPeriodDropdownOpen((open) => !open)}
            className='flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
          >
            <Clock size={14} />
            Period: {PERIOD_OPTIONS.find((opt) => opt.value === period)?.label}
            <ChevronDown size={14} />
          </button>
          {isPeriodDropdownOpen && (
            <div className='absolute right-0 z-10 mt-1 overflow-hidden bg-white border rounded-lg shadow-lg top-full w-44'>
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type='button'
                  onClick={() => { setPeriod(opt.value); setIsPeriodDropdownOpen(false) }}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-gray-100 ${period === opt.value ? 'text-primary font-medium' : 'text-gray-600'}`}
                >
                  {opt.label}
                  {period === opt.value && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {isFiltered && (
          <button
            onClick={resetFilters}
            className='flex items-center gap-1 text-xs text-gray-400 transition-colors shrink-0 whitespace-nowrap hover:text-red-400'
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_1fr_2fr_1.5fr_2fr_1fr_2fr_1fr_1fr] gap-1 py-3 px-6 border-b font-medium'>
          <p>#</p>
          <p>Ref</p>
          <p>Patient</p>
          <p>Phone</p>
          <p>Doctor</p>
          <p>Type</p>
          <p>Date & Time</p>
          {/* <p>Fees</p> */}
          <p>Payment</p>
          <p>Status</p>
        </div>

        {filtered.length === 0 ? (
          <p className='py-6 text-center text-gray-400'>No appointments found</p>
        ) : (
          paginatedAppointments.map((item, index) => (
            <div
              className='flex flex-wrap justify-between max-sm:gap-2 max-sm:text-base sm:grid grid-cols-[0.5fr_1fr_2fr_1.5fr_2fr_1fr_2fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'
              key={item._id}
            >
              <p className='max-sm:hidden'>{index + 1}</p>
              <p>{item.ref || '-'}</p>
              <p>{item.userData?.name || 'N/A'}</p>
              <p>{item.userData?.phoneNumber || item.userData?.phone || '-'}</p>
              <p>{item.docData?.name || 'N/A'}</p>
              <p>{item.isWalkIn ? 'Walk-in' : 'Online'}</p>
              <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
              {/* <p>{currency}{item.amount}</p> */}
              <p className={item.payment ? 'text-green-600' : 'text-red-500'}>
                {item.payment ? 'Paid' : 'Unpaid'}
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

export default AllApointments
