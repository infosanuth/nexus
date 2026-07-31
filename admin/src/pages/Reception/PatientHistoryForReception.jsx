import React from 'react'
import { useEffect, useMemo, useContext, useState } from 'react'
import { Download, Search, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { ReceptionContext } from '../../context/ReceptionContext'
import { AppContext } from '../../context/AppContext'

const GENDER_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
]

const METHOD_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Online', value: 'online' },
  { label: 'Walk-in', value: 'walk-in' },
]

const slotDateToUTC = (slotDate) => {
  const [d, m, y] = slotDate.split('_').map(Number)
  return Date.UTC(y, m - 1, d)
}

const PatientHistoryForReception = () => {

  const { rToken, appointments, getAppointments } = useContext(ReceptionContext)
  const { calculateAge, slotDateFormat } = useContext(AppContext)
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')

  useEffect(() => {
    if (rToken) {
      getAppointments()
    }
  }, [rToken])

  const patients = useMemo(() => {
    const map = new Map()

    appointments.filter((item) => item.payment && !item.cancelled).forEach((item) => {
      const key = item.userData.phoneNumber || item.userData.phone || item.userId
      const existing = map.get(key)
      const visitDay = slotDateToUTC(item.slotDate)

      // Keep only the most recent visit per patient
      if (!existing || visitDay >= existing.visitDay) {
        map.set(key, {
          ref: item.ref || '-',
          name: item.userData.name,
          phone: item.userData.phoneNumber || item.userData.phone || '-',
          age: item.userData.age || calculateAge(item.userData.dob),
          gender: item.userData.gender || 'Not Selected',
          doctor: item.docData?.name || 'N/A',
          method: item.isWalkIn ? 'Walk-in' : 'Online',
          lastVisit: `${slotDateFormat(item.slotDate)}, ${item.slotTime}`,
          visitDay
        })
      }
    })

    return Array.from(map.values()).sort((a, b) => b.visitDay - a.visitDay)
  }, [appointments])

  const filteredPatients = patients.filter((item) => {
    const term = search.trim().toLowerCase()
    const matchesSearch = !term
      || item.name?.toLowerCase().includes(term)
      || item.phone?.toLowerCase().includes(term)
      || String(item.ref || '').includes(term)
    const matchesGender = genderFilter === 'all' || item.gender === genderFilter
    const matchesMethod = methodFilter === 'all'
      || (methodFilter === 'online' && item.method === 'Online')
      || (methodFilter === 'walk-in' && item.method === 'Walk-in')

    return matchesSearch && matchesGender && matchesMethod
  })

  const isFiltered = genderFilter !== 'all' || methodFilter !== 'all' || search

  const resetFilters = () => {
    setGenderFilter('all')
    setMethodFilter('all')
    setSearch('')
  }

  const handleExport = () => {
    const header = ['Ref', 'Patient', 'Phone Number', 'Age', 'Gender', 'Doctor', 'Method', 'Last Visit']
    const rows = filteredPatients.map((item) => [
      item.ref,
      item.name,
      item.phone,
      item.age,
      item.gender,
      item.doctor,
      item.method,
      item.lastVisit
    ])

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    ws['!cols'] = [
      { wch: 10 }, // Ref
      { wch: 20 }, // Patient
      { wch: 15 }, // Phone Number
      { wch: 8 },  // Age
      { wch: 12 }, // Gender
      { wch: 18 }, // Doctor
      { wch: 10 }, // Method
      { wch: 20 }, // Last Visit
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Patient History')
    XLSX.writeFile(wb, `patient-history-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // Pagination
  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PAGE_SIZE))
  const paginatedPatients = filteredPatients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  // End pagination

  useEffect(() => {
    setPage(1)
  }, [search, genderFilter, methodFilter])

  return (
    <div className='w-full max-w-6xl m-5'>

      <div className='flex flex-wrap items-center justify-between gap-3 mb-3'>
        <p className='text-lg font-medium'>Patient History <span className='text-sm font-normal text-gray-400'>({filteredPatients.length})</span></p>
      </div>

      <div className='flex items-center gap-3 px-5 py-3 mb-3 overflow-x-auto bg-white border rounded-xl'>
        <div className='flex items-center gap-2 shrink-0'>
          <span className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>Gender</span>
          {GENDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setGenderFilter(opt.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${genderFilter === opt.value
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
          <span className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>Method</span>
          {METHOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMethodFilter(opt.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${methodFilter === opt.value
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
              {opt.label}
            </button>
          ))}
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
          <div className='relative w-64'>
            <Search size={14} className='absolute text-gray-400 -translate-y-1/2 left-3 top-1/2' />
            <input
              type='text'
              placeholder='Search by ref, name or phone number'
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

          <button
            onClick={handleExport}
            className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors bg-white border rounded-lg hover:border-gray-300 hover:text-gray-800'
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.4fr_0.8fr_1.4fr_1.1fr_0.5fr_0.8fr_1.2fr_0.8fr_1.4fr] gap-1 py-3 px-6 border-b bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>
          <p>#</p>
          <p>Ref</p>
          <p>Patient</p>
          <p>Phone Number</p>
          <p>Age</p>
          <p>Gender</p>
          <p>Doctor</p>
          <p>Method</p>
          <p>Last Visit</p>
        </div>

        {filteredPatients.length === 0 ? (
          <p className='py-6 text-center text-gray-400'>No patients found</p>
        ) : (
          paginatedPatients.map((item, index) => (
            <div className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.4fr_0.8fr_1.4fr_1.1fr_0.5fr_0.8fr_1.2fr_0.8fr_1.4fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
              <p className='max-sm:hidden'>{(page - 1) * PAGE_SIZE + index + 1}</p>
              <p>{item.ref}</p>
              <p>{item.name}</p>
              <p>{item.phone}</p>
              <p className='max-sm:hidden'>{item.age}</p>
              <p>{item.gender}</p>
              <p>{item.doctor}</p>
              <p>{item.method}</p>
              <p>{item.lastVisit}</p>
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

export default PatientHistoryForReception
