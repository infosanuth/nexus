import React, { useContext, useEffect, useRef, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { Search, Stethoscope, X } from 'lucide-react'

const DoctorRegistry = () => {

  const { doctors, aToken, getAllDoctors, specialities, getSpecialities } = useContext(AdminContext)

  const [search, setSearch] = useState('')
  const [specialityFilter, setSpecialityFilter] = useState('all')
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false)
  const doctorDropdownRef = useRef(null)

  useEffect(() => {
    if (aToken) getAllDoctors()
  }, [aToken])

  useEffect(() => {
    getSpecialities()
  }, [])

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

  const filteredDoctors = doctors.filter((item) => {
    const term = search.trim().toLowerCase()
    const matchesSearch = !term || item.name?.toLowerCase().includes(term)
    const matchesSpeciality = specialityFilter === 'all' || item.speciality === specialityFilter
    return matchesSearch && matchesSpeciality
  })

  const doctorNames = [...new Set(doctors.map((item) => item.name?.trim()).filter(Boolean))].sort()
  const doctorSearchResults = doctorNames.filter((name) => name.toLowerCase().includes(search.trim().toLowerCase()))

  const isFiltered = search || specialityFilter !== 'all'

  const resetFilters = () => {
    setSearch('')
    setSpecialityFilter('all')
  }

  // Pagination
  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE))
  const paginatedDoctors = filteredDoctors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, specialityFilter])

  return (
    <div className='w-full max-w-5xl m-5'>

      <div className='flex flex-wrap items-center justify-between gap-3 mb-3'>
        <p className='text-lg font-medium'>Doctor Registry <span className='text-sm font-normal text-gray-400'>({filteredDoctors.length})</span></p>
      </div>

      <div className='flex flex-wrap items-center gap-3 px-5 py-3 mb-3 bg-white border rounded-xl'>
        <div className='relative w-72' ref={doctorDropdownRef}>
          <Search size={14} className='absolute text-gray-400 -translate-y-1/2 left-3 top-1/2' />
          <input
            type='text'
            placeholder='Search by name'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsDoctorDropdownOpen(true)}
            className='w-full py-1.5 pl-8 pr-8 text-sm border rounded-lg focus:outline-none focus:border-primary'
            autoComplete='off'
          />
          {search && (
            <button onClick={() => { setSearch(''); setIsDoctorDropdownOpen(false) }} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500'>
              <X size={13} />
            </button>
          )}
          {isDoctorDropdownOpen && doctorSearchResults.length > 0 && (
            <div className='absolute left-0 right-0 z-10 mt-1 overflow-y-auto bg-white border rounded-lg shadow-lg top-full max-h-56'>
              {doctorSearchResults.map((name) => (
                <button
                  key={name}
                  type='button'
                  onClick={() => { setSearch(name); setIsDoctorDropdownOpen(false) }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${search === name ? 'bg-primary/10 text-primary' : ''}`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        <select
          value={specialityFilter}
          onChange={(e) => setSpecialityFilter(e.target.value)}
          className='py-1.5 pl-3 pr-8 text-sm text-gray-600 border rounded-lg shrink-0 focus:outline-none focus:border-primary'
        >
          <option value='all'>All Specialities</option>
          {specialities.map((item) => (
            <option key={item._id} value={item.speciality}>{item.speciality}</option>
          ))}
        </select>

        {isFiltered && (
          <button
            onClick={resetFilters}
            className='flex items-center gap-1 text-xs text-gray-400 transition-colors shrink-0 whitespace-nowrap hover:text-red-400'
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      <div className='overflow-hidden bg-white border rounded-xl'>
        <table className='w-full text-sm text-left'>
          <thead className='border-b bg-gray-50'>
            <tr>
              <th className='px-6 py-3 font-medium text-gray-500'>#</th>
              <th className='px-6 py-3 font-medium text-gray-500'>Doctor Name</th>
              <th className='px-6 py-3 font-medium text-gray-500'>Specialty</th>
              <th className='px-6 py-3 font-medium text-gray-500'>Reg. No</th>
              <th className='px-6 py-3 font-medium text-gray-500'>Gov. Hospital</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDoctors.length > 0 ? (
              paginatedDoctors.map((item, index) => (
                <tr key={item._id} className='transition-colors border-b last:border-0 hover:bg-gray-50'>
                  <td className='px-6 py-4 text-gray-400'>{(page - 1) * PAGE_SIZE + index + 1}</td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-2'>
                      <Stethoscope size={14} className='text-gray-400' />
                      <p className='font-medium text-gray-800'>{item.name}</p>
                    </div>
                  </td>
                  <td className='px-6 py-4 text-gray-500'>{item.speciality}</td>
                  <td className='px-6 py-4 text-gray-500'>{item.registrationNumber}</td>
                  <td className='px-6 py-4 text-gray-500'>{item.governmentHospital || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className='px-6 py-12 text-sm text-center text-gray-400'>
                  No doctors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

export default DoctorRegistry
