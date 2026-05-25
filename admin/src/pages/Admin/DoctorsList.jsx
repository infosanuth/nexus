import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { ClipboardMinus } from 'lucide-react';
import html2pdf from 'html2pdf.js'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import {useState } from 'react'

const getPageSize = () => {
  const w = window.innerWidth
  if (w >= 1920) return 12  // 24"+ displays
  if (w >= 1024) return 10  // 13"–22" laptops & monitors
  if (w >= 640)  return 10  // tablets
  return 6                   // mobile
}

const DoctorsList = () => {

  const { doctors, aToken, getAllDoctors, changeAvailability } = useContext(AdminContext)

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

  const backendUrl = import.meta.env.VITE_BACKEND_URL

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
    <div>
      <div className='m-5'>
        <h1 className='text-lg font-medium'>All Doctors</h1>

        <div className='flex flex-wrap w-full gap-4 pt-5 gap-y-6'>
          {paginatedDoctors.map((item, index) => (
            <div
              className='border border-indigo-200 rounded-xl max-w-56 overflow-hidden cursor-pointer group hover:translate-y-[-10px] transition-all duration-500'
              key={index}
            >
              <img className='bg-indigo-50' src={`http://localhost:4000${item.image}`} alt={item.name} />
              <div className='p-4'>
                <p className='text-lg font-medium text-neutral-800'>{item.name}</p>
                <p className='text-sm text-zinc-600'>{item.speciality}</p>
                <div className='flex items-center gap-1 mt-2 text-sm'>
                  <input className="accent-blue-600" onChange={() => changeAvailability(item._id)} type="checkbox" checked={item.available} />
                  <p>Available</p>
                </div>
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


