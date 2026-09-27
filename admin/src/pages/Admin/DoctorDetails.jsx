import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { Download, Search, X } from 'lucide-react'
import * as XLSX from 'xlsx'

const DoctorDetails = () => {

  const { doctors, aToken, getAllDoctors } = useContext(AdminContext)

  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState('all')

  useEffect(() => {
    if (aToken) getAllDoctors()
  }, [aToken])

  const filteredDoctors = doctors.filter((item) => {
    const term = search.trim().toLowerCase()
    const matchesSearch = !term || item.name?.toLowerCase().includes(term) || item.email?.toLowerCase().includes(term) || item.registrationNumber?.toLowerCase().includes(term)
    const matchesGender = genderFilter === 'all' || item.gender === genderFilter

    return matchesSearch && matchesGender
  })

  const isFiltered = search || genderFilter !== 'all'

  const resetFilters = () => {
    setSearch('')
    setGenderFilter('all')
  }

  const handleExport = () => {
    const header = ['Name', 'Email', 'Reg. No', 'Gender', 'Fees', 'Available']
    const rows = filteredDoctors.map((item) => [
      item.name,
      item.email,
      item.registrationNumber,
      item.gender || '-',
      item.fees,
      item.available ? 'Yes' : 'No'
    ])

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    ws['!cols'] = [
      { wch: 22 }, // Name
      { wch: 28 }, // Email
      { wch: 16 }, // Reg. No
      { wch: 10 }, // Gender
      { wch: 10 }, // Fees
      { wch: 10 }, // Available
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Doctor Details')
    XLSX.writeFile(wb, `doctor-details-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // Pagination
  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE))
  const paginatedDoctors = filteredDoctors.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [search, genderFilter])

  return (
    <div className='w-full max-w-6xl m-5'>

      <div className='flex flex-wrap items-center justify-between gap-3 mb-3'>
        <p className='text-lg font-medium'>Doctor Details <span className='text-sm font-normal text-gray-400'>({filteredDoctors.length})</span></p>
      </div>

      <div className='flex items-center gap-3 px-5 py-3 mb-3 overflow-x-auto bg-white border rounded-xl'>
        <div className='relative w-64'>
          <Search size={14} className='absolute text-gray-400 -translate-y-1/2 left-3 top-1/2' />
          <input
            type='text'
            placeholder='Search by name, email or reg. no'
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

        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className='py-1.5 pl-3 pr-8 text-sm text-gray-600 border rounded-lg shrink-0 focus:outline-none focus:border-primary'
        >
          <option value='all'>All Genders</option>
          <option value='Male'>Male</option>
          <option value='Female'>Female</option>
        </select>

        {isFiltered && (
          <button
            onClick={resetFilters}
            className='flex items-center gap-1 text-xs text-gray-400 transition-colors shrink-0 whitespace-nowrap hover:text-red-400'
          >
            <X size={12} /> Clear
          </button>
        )}

        <button
          onClick={handleExport}
          className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors bg-white border rounded-lg shrink-0 hover:border-gray-300 hover:text-gray-800 ml-auto'
        >
          <Download size={14} /> Export
        </button>
      </div>

      <div className='overflow-hidden bg-white border rounded-xl'>
        <table className='w-full text-sm text-left'>
          <thead className='border-b bg-gray-50'>
            <tr>
              <th className='px-6 py-3 font-medium text-gray-500'>#</th>
              <th className='px-6 py-3 font-medium text-gray-500'>Name</th>
              <th className='px-6 py-3 font-medium text-gray-500'>Email</th>
              <th className='px-6 py-3 font-medium text-gray-500'>Reg. No</th>
              <th className='px-6 py-3 font-medium text-gray-500'>Gender</th>
              <th className='px-6 py-3 font-medium text-gray-500'>Fees</th>
              <th className='px-6 py-3 font-medium text-gray-500'>Availability</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDoctors.length > 0 ? (
              paginatedDoctors.map((item, index) => (
                <tr key={item._id} className='transition-colors border-b last:border-0 hover:bg-gray-50'>
                  <td className='px-6 py-4 text-gray-400'>{(page - 1) * PAGE_SIZE + index + 1}</td>
                  <td className='px-6 py-4'>
                    <p className='font-medium text-gray-800'>{item.name}</p>
                  </td>
                  <td className='px-6 py-4 text-gray-500'>{item.email}</td>
                  <td className='px-6 py-4 text-gray-500'>{item.registrationNumber}</td>
                  <td className='px-6 py-4 text-gray-500'>{item.gender || '-'}</td>
                  <td className='px-6 py-4 text-gray-500'>Rs {item.fees}</td>
                  <td className='px-6 py-4 text-gray-500'>{item.available ? 'Yes' : 'No'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className='px-6 py-12 text-sm text-center text-gray-400'>
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

export default DoctorDetails
