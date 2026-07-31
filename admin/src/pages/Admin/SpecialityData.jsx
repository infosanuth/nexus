import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminContext } from '../../context/AdminContext'
import { Download, Search, X } from 'lucide-react'
import * as XLSX from 'xlsx'

const SpecialityData = () => {
  const { specialities, getSpecialities, doctors, getAllDoctors, aToken } = useContext(AdminContext)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    getSpecialities()
  }, [])

  // Close the speciality search dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (aToken) getAllDoctors()
  }, [aToken])

  const rows = useMemo(() => {
    return specialities.map((item) => ({
      id: item._id,
      name: item.speciality,
      fee: item.channelingFee,
      doctorCount: doctors.filter((doc) => doc.speciality === item.speciality).length
    }))
  }, [specialities, doctors])

  const filteredRows = rows.filter((item) => {
    const term = search.trim().toLowerCase()
    return !term || item.name?.toLowerCase().includes(term)
  })

  const specialityNames = [...new Set(rows.map((item) => item.name?.trim()).filter(Boolean))].sort()
  const specialitySearchResults = specialityNames.filter((name) => name.toLowerCase().includes(search.trim().toLowerCase()))

  const handleExport = () => {
    const header = ['Speciality', 'Fee', 'Doctors']
    const data = filteredRows.map((item) => [item.name, item.fee, item.doctorCount])

    const ws = XLSX.utils.aoa_to_sheet([header, ...data])
    ws['!cols'] = [
      { wch: 20 }, // Speciality
      { wch: 10 }, // Fee
      { wch: 10 }, // Doctors
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Speciality Data')
    XLSX.writeFile(wb, `speciality-data-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className='w-full max-w-4xl m-5'>
      <p className='mb-3 text-lg font-medium'>
        Speciality Data <span className='text-sm font-normal text-gray-400'>({filteredRows.length})</span>
      </p>

      {/* Search + Export toolbar */}
      <div className='flex items-center gap-3 mb-3'>
        <div className='relative flex-1 max-w-xs' ref={dropdownRef}>
          <Search size={14} className='absolute text-gray-400 -translate-y-1/2 left-3 top-1/2' />
          <input
            type='text'
            placeholder='Search by speciality'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsDropdownOpen(true)}
            className='w-full py-1.5 pl-8 pr-8 text-sm border rounded-lg focus:outline-none focus:border-primary'
            autoComplete='off'
          />
          {search && (
            <button onClick={() => { setSearch(''); setIsDropdownOpen(false) }} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500'>
              <X size={13} />
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

        <button
          onClick={handleExport}
          className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors border rounded-lg shrink-0 hover:border-gray-300 hover:text-gray-800'
        >
          <Download size={14} /> Export
        </button>
      </div>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.4fr_2fr_1fr_1fr] gap-1 py-3 px-6 border-b bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>
          <p>#</p>
          <p>Speciality</p>
          <p>Fee</p>
          <p className='text-center'>Doctors</p>
        </div>

        {filteredRows.length === 0 ? (
          <p className='py-6 text-center text-gray-400'>No specialities found</p>
        ) : (
          filteredRows.map((item, index) => (
            <div
              onClick={() => navigate(`/speciality-data/${encodeURIComponent(item.name)}`)}
              className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.4fr_2fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50 cursor-pointer'
              key={item.id}
            >
              <p className='max-sm:hidden'>{index + 1}</p>
              <p className='font-medium text-gray-800'>{item.name}</p>
              <p>Rs {item.fee?.toLocaleString()}</p>
              <p className='text-center'>{item.doctorCount}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SpecialityData
