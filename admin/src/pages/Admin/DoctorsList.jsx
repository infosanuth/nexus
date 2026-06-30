import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { ClipboardMinus, Pencil } from 'lucide-react';
import html2pdf from 'html2pdf.js'
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

  const { doctors, aToken, getAllDoctors, changeAvailability, backendUrl } = useContext(AdminContext)

  const [appointments, setAppointments] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(getPageSize)

  const navigate = useNavigate()

  useEffect(() => {
    if (aToken) getAllDoctors()
  }, [aToken])

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

  const totalPages = Math.ceil(doctors.length / pageSize)
  const paginatedDoctors = doctors.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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

        <div className='grid w-full gap-4 pt-5 gap-y-6' style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {paginatedDoctors.map((item, index) => (
            <div
              className='flex flex-col items-center justify-center gap-2 p-5 text-center transition-all duration-300 bg-white border border-gray-200 cursor-pointer rounded-2xl min-h-[260px] hover:-translate-y-1 hover:shadow-lg'
              key={index}
            >
              <div
                className='relative group cursor-pointer'
                onClick={() => navigate(`/edit-doctor/${item._id}`)}
              >
                <img
                  src={item.image ? `${backendUrl}${item.image}` : assets.default_doctor}
                  alt={item.name}
                  className='object-cover w-24 h-24 rounded-full ring-4 ring-blue-50 bg-blue-50'
                />
                <div className='absolute inset-0 flex items-center justify-center transition-opacity bg-black/40 rounded-full opacity-0 group-hover:opacity-100'>
                  <Pencil size={18} className='text-white' />
                </div>
              </div>
              {item.gender && (
                <p className={`text-xs font-medium ${item.gender.toLowerCase() === 'female' ? 'text-pink-600' : 'text-blue-600'}`}>
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

        {doctors.length > 0 && (
          <p className='mt-3 text-xs text-center text-gray-400'>
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, doctors.length)} of {doctors.length} doctors
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

             {/* onClick={() => {navigate(`/appointments/${item._id}`)}} */}
        </div>
      </div>


      <button onClick={handleOnClick} className="fixed flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded right-5 bottom-5 hover:bg-blue-700">
        <ClipboardMinus size={20} />
        Generate Report
      </button>
    </div>

  )
}

export default DoctorsList


