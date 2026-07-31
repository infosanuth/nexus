import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Clock, Download, Search, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { PERIOD_OPTIONS } from '../../utils/date'

const SpecialityReport = () => {

  const { aToken, specialityReport, getSpecialityReport } = useContext(AdminContext)
  const { currency } = useContext(AppContext)
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState('all')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const periodDropdownRef = useRef(null)

  useEffect(() => {
    if (aToken) {
      getSpecialityReport(period)
    }
  }, [aToken, period])

  // Close the speciality search / period dropdowns when clicking outside of them
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target)) {
        setIsPeriodDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const specialityNames = [...new Set(specialityReport.map((item) => item.specialityName?.trim()).filter(Boolean))].sort()
  const specialitySearchResults = specialityNames.filter((name) => name.toLowerCase().includes(search.trim().toLowerCase()))

  const filteredReport = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return specialityReport
    return specialityReport.filter((item) => item.specialityName.toLowerCase().includes(term))
  }, [specialityReport, search])

  // Pagination
  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(filteredReport.length / PAGE_SIZE))
  const paginatedReport = filteredReport.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  // End pagination

  useEffect(() => {
    setPage(1)
  }, [search])

  const handleExport = () => {
    const header = ['Speciality', 'Doctors', 'Earnings', 'Profit']
    const rows = filteredReport.map((item) => [
      item.specialityName,
      item.doctorCount,
      item.earnings,
      item.profit
    ])

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    ws['!cols'] = [
      { wch: 22 }, // Speciality
      { wch: 12 }, // Doctors
      { wch: 14 }, // Earnings
      { wch: 14 }, // Profit
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Speciality Report')
    XLSX.writeFile(wb, `speciality-report-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className='w-full max-w-4xl m-5'>

      <p className='mb-3 text-lg font-medium'>Speciality Report</p>

      <div className='flex flex-wrap items-center gap-3 px-5 py-3 mb-3 bg-white border rounded-xl'>
        <div className='relative' ref={dropdownRef}>
          <Search size={14} className='absolute text-gray-400 -translate-y-1/2 left-2.5 top-1/2' />
          <input
            type='text'
            placeholder='Search speciality...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsDropdownOpen(true)}
            className='py-1.5 pl-7 pr-7 text-xs transition-colors border border-gray-200 rounded-lg w-52 focus:outline-none focus:border-primary'
            autoComplete='off'
          />
          {search && (
            <button onClick={() => { setSearch(''); setIsDropdownOpen(false) }} className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500'>
              <X size={12} />
            </button>
          )}
          {isDropdownOpen && specialitySearchResults.length > 0 && (
            <div className='absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border rounded-lg shadow-lg z-10'>
              {specialitySearchResults.map((name) => (
                <button
                  key={name}
                  type='button'
                  onClick={() => { setSearch(name); setIsDropdownOpen(false) }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${search === name ? 'bg-primary/10 text-primary' : ''}`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className='flex items-center gap-3 ml-auto'>
          <div className='relative' ref={periodDropdownRef}>
            <button
              type='button'
              onClick={() => setIsPeriodDropdownOpen((open) => !open)}
              className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors border rounded-lg hover:border-gray-300 hover:text-gray-800'
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

          <button
            onClick={handleExport}
            className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors border rounded-lg hover:border-gray-300 hover:text-gray-800'
          >
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className='overflow-hidden bg-white border rounded-xl text-sm max-h-[80vh] overflow-y-auto'>
        <div className='max-sm:hidden grid grid-cols-[2fr_1fr_1fr_1fr] gap-1 py-3 px-6 border-b bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>
          <p>Speciality</p>
          <p className='text-center'>Doctors</p>
          <p className='text-right'>Earnings</p>
          <p className='text-right'>Profit</p>
        </div>

        {filteredReport.length === 0
          ? <p className='p-6 text-gray-500'>No specialities found</p>
          : paginatedReport.map((item) => (
            <div
              className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[2fr_1fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b last:border-0'
              key={item.specialityId}
            >
              <p className='font-medium text-gray-800'>{item.specialityName}</p>
              <p className='text-center'>{item.doctorCount}</p>
              <p className={`text-right ${item.earnings ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>
                {currency}{item.earnings.toLocaleString()}
              </p>
              <p className={`text-right ${item.profit ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>
                {currency}{item.profit.toLocaleString()}
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

export default SpecialityReport
