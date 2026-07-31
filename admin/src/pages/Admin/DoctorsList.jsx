import React, { useContext, useEffect, useRef } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { ClipboardMinus, Download, Pencil, Search, X } from 'lucide-react';
import html2pdf from 'html2pdf.js'
import * as XLSX from 'xlsx'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useState } from 'react'
import { assets } from '../../assets/assets'

const getPageSize = () => {
  const w = window.innerWidth
  if (w >= 1920) return 12  // 24"+ displays
  if (w >= 1024) return 10  // 13"–22" laptops & monitors
  if (w >= 640)  return 10  // tablets
  return 6                   // mobile
}

const DoctorsList = () => {

  const { doctors, aToken, getAllDoctors, changeAvailability, backendUrl, specialities, getSpecialities } = useContext(AdminContext)

  const [appointments, setAppointments] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(getPageSize)

  const [search, setSearch] = useState('')
  const [specialityFilter, setSpecialityFilter] = useState('all')
  const [genderFilter, setGenderFilter] = useState('all')
  const [isDoctorDropdownOpen, setIsDoctorDropdownOpen] = useState(false)
  const doctorDropdownRef = useRef(null)

  const navigate = useNavigate()

  useEffect(() => {
    if (aToken) getAllDoctors()
  }, [aToken])

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

  useEffect(() => {
    getSpecialities()
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const next = getPageSize()
      setPageSize(prev => {
        if (prev !== next) setCurrentPage(1)
        return next
      })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const filteredDoctors = doctors.filter((item) => {
    const term = search.trim().toLowerCase()
    const matchesSearch = !term || item.name?.toLowerCase().includes(term)
    const matchesSpeciality = specialityFilter === 'all' || item.speciality === specialityFilter
    const matchesGender = genderFilter === 'all' || item.gender === genderFilter

    return matchesSearch && matchesSpeciality && matchesGender
  })

  const doctorNames = [...new Set(doctors.map((item) => item.name?.trim()).filter(Boolean))].sort()
  const doctorSearchResults = doctorNames.filter((name) => name.toLowerCase().includes(search.trim().toLowerCase()))

  const isFiltered = search || specialityFilter !== 'all' || genderFilter !== 'all'

  const resetFilters = () => {
    setSearch('')
    setSpecialityFilter('all')
    setGenderFilter('all')
  }

  const handleExport = () => {
    const header = ['Name', 'Speciality', 'Gender', 'Fees', 'Available']
    const rows = filteredDoctors.map((item) => [
      item.name,
      item.speciality,
      item.gender || '-',
      item.fees,
      item.available ? 'Yes' : 'No'
    ])

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    ws['!cols'] = [
      { wch: 22 }, // Name
      { wch: 18 }, // Speciality
      { wch: 10 }, // Gender
      { wch: 10 }, // Fees
      { wch: 10 }, // Available
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Doctors')
    XLSX.writeFile(wb, `doctors-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [search, specialityFilter, genderFilter])

  const totalPages = Math.ceil(filteredDoctors.length / pageSize)
  const paginatedDoctors = filteredDoctors.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getPageNumbers = () => {
    const pages = []
    const left = currentPage - 1
    const right = currentPage + 1
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        pages.push(i)
      } else if (i === left - 1 || i === right + 1) {
        pages.push('...')
      }
    }
    return pages
  }

  async function handleOnClick() {
    const element = document.querySelector('#invoice')
    html2pdf(element)
  }

  const getAppointmentsByDoctor = async (docId) => {
    try {
      const { data } = await axios.post(backendUrl + '/api/admin/appointments-doctor', { docId }, { headers: { aToken } }
      )

      if (data.success) {
        setAppointments(data.appointments)
        console.log("Appointments:", data.appointments)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
      console.log(error)
    }
  }


  return (
    <div className='flex-1 w-full'>
      <div className='m-5'>
        <h1 className='text-lg font-medium'>All Doctors</h1>

        <div className='flex flex-wrap items-center gap-3 mt-4'>
          <div className='relative flex-1 min-w-[200px]' ref={doctorDropdownRef}>
            <Search size={14} className='absolute text-gray-400 -translate-y-1/2 left-3 top-1/2' />
            <input
              type='text'
              placeholder='Search by name'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsDoctorDropdownOpen(true)}
              className='w-full py-2 pl-8 pr-8 text-sm border rounded-lg focus:outline-none focus:border-primary'
              autoComplete='off'
            />
            {search && (
              <button onClick={() => { setSearch(''); setIsDoctorDropdownOpen(false) }} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500'>
                <X size={13} />
              </button>
            )}
            {isDoctorDropdownOpen && doctorSearchResults.length > 0 && (
              <div className='absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border rounded-lg shadow-lg z-10'>
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
            className='py-2 pl-3 pr-8 text-sm text-gray-600 border rounded-lg shrink-0 focus:outline-none focus:border-primary'
          >
            <option value='all'>All Specialities</option>
            {specialities.map((item) => (
              <option key={item._id} value={item.speciality}>{item.speciality}</option>
            ))}
          </select>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className='py-2 pl-3 pr-8 text-sm text-gray-600 border rounded-lg shrink-0 focus:outline-none focus:border-primary'
          >
            <option value='all'>All Genders</option>
            <option value='Male'>Male</option>
            <option value='Female'>Female</option>
          </select>

          <button
            onClick={handleExport}
            className='flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 transition-colors border rounded-lg shrink-0 hover:border-gray-300 hover:text-gray-800'
          >
            <Download size={14} /> Export
          </button>

          {isFiltered && (
            <button
              onClick={resetFilters}
              className='flex items-center gap-1 text-xs text-gray-400 transition-colors shrink-0 whitespace-nowrap hover:text-red-400'
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {filteredDoctors.length === 0 ? (
          <p className='py-10 text-center text-gray-400'>No doctors found</p>
        ) : (
        <div className='grid w-full gap-4 pt-5 gap-y-9' style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {paginatedDoctors.map((item, index) => (
            <div
              className='flex flex-col items-center justify-center gap-2 p-5 text-center transition-all duration-300 bg-white border border-gray-200 cursor-pointer rounded-2xl min-h-[300px] hover:-translate-y-1 hover:shadow-lg'
              key={index}
            >
              <div
                className='relative cursor-pointer group'
                onClick={() => navigate(`/edit-doctor/${item._id}`)}
              >
                <img
                  src={item.image ? `${backendUrl}${item.image}` : assets.default_doctor}
                  alt={item.name}
                  className='object-cover w-24 h-24 bg-gray-100 rounded-full ring-4 ring-gray-100'
                />
                <div className='absolute inset-0 flex items-center justify-center transition-opacity rounded-full opacity-0 bg-black/40 group-hover:opacity-100'>
                  <Pencil size={18} className='text-white' />
                </div>
              </div>
              {item.gender && (
                <p className='text-xs font-medium text-gray-600'>
                  {item.gender}
                </p>
              )}
              <p className='mt-6 font-semibold text-gray-900'>{item.name}</p>
              <p className='text-sm text-gray-500'>{item.speciality}</p>
              <div className='flex items-center gap-1 mt-2 text-sm'>
                <input className="accent-blue-600" onChange={() => changeAvailability(item._id)} type="checkbox" checked={item.available} />
                <p>Available</p>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='flex flex-wrap items-center justify-center gap-1 mt-8'>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className='px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all'
            >
              Prev
            </button>

            {getPageNumbers().map((page, idx) =>
              page === '...'
                ? <span key={`ellipsis-${idx}`} className='px-2 py-1.5 text-sm text-gray-400 select-none'>…</span>
                : <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1.5 text-sm border rounded transition-all ${currentPage === page ? 'bg-indigo-500 text-white border-indigo-500' : 'border-gray-300 hover:bg-gray-100'}`}
                  >
                    {page}
                  </button>
            )}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className='px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all'
            >
              Next
            </button>
          </div>
        )}

        {filteredDoctors.length > 0 && (
          <p className='mt-3 text-xs text-center text-gray-400'>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredDoctors.length)} of {filteredDoctors.length} doctors
          </p>
        )}
      </div>


      <div className='hidden'>
        <div id="invoice" className="p-6 text-sm text-black font-sans relative min-h-[100vh]">

          {/* Date - top left */}
          <div className="mb-2">
            <p id="report-date" className="m-0 text-sm">Date: 2025-08-01</p>
          </div>

          {/* Title - centered */}
          <h2 className="mb-6 text-xl font-semibold text-center">Doctor List</h2>

          {/* Table header */}
          <div className="grid grid-cols-[40px_1.5fr_2fr_1fr] border-t border-b border-gray-300 font-medium bg-gray-100 py-2 px-4">
            <div>#</div>
            <div>Name</div>
            <div>Specialty</div>
            <div>Available</div>
          </div>

          {/* Appointment rows */}
          {doctors.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-[40px_1.5fr_2fr_1fr] border-b border-gray-200 py-2 px-4 items-center"
            >
              <p>{index + 1}</p>
              <p>{item.name}</p>
              <div>{item.speciality}</div>
              <div>{item.available ? "Yes" : "No"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>

  )
}

export default DoctorsList


