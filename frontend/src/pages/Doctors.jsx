import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const getPageSize = () => {
  const w = window.innerWidth
  if (w >= 1920) return 12  // 24"+ / large displays
  if (w >= 1024) return 8   // 13"–22" laptops & monitors
  if (w >= 640) return 10   // tablets
  return 6                   // mobile
}

const specialities = [
  'General physician',
  'Gynecologist',
  'Dermatologist',
  'Pediatricians',
  'Neurologist',
  'Gastroenterologist',
]

const Doctors = () => {
  const { speciality } = useParams()
  const [filterDoc, setFilterDoc] = useState([])
  const [showFilter, setShowFilter] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(getPageSize)
  const navigate = useNavigate()
  const { doctors } = useContext(AppContext)

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

  const applyFilter = () => {
    if (speciality) {
      setFilterDoc(doctors.filter(doc => doc.speciality === speciality))
    } else {
      setFilterDoc(doctors)
    }
    setCurrentPage(1)
  }

  useEffect(() => {
    applyFilter()
  }, [doctors, speciality])

  const totalPages = Math.ceil(filterDoc.length / pageSize)
  const paginatedDocs = filterDoc.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const getPageNumbers = () => {
    const pages = []
    const delta = 1
    const left = currentPage - delta
    const right = currentPage + delta

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        pages.push(i)
      } else if (i === left - 1 || i === right + 1) {
        pages.push('...')
      }
    }
    return pages
  }

  return (
    <div>
      <p className='pb-2 text-gray-600'>Browse through the doctors specialist.</p>

      <button
        className={`py-1 px-3 border rounded text-sm transition-all sm:hidden ${showFilter ? 'bg-[#64748B] text-white' : ''}`}
        onClick={() => setShowFilter(prev => !prev)}
      >
        Filter
      </button>

      <div className='flex flex-col items-start gap-5 mt-5 sm:flex-row'>
        {/* Sidebar filters */}
        <div className={`flex flex-col gap-4 text-sm text-gray-600 ${showFilter ? 'flex' : 'hidden sm:flex'}`}>
          {specialities.map((spec) => (
            <p
              key={spec}
              onClick={() => speciality === spec ? navigate('/doctors') : navigate(`/doctors/${spec}`)}
              className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === spec ? 'bg-indigo-100 text-black' : ''}`}
            >
              {spec}
            </p>
          ))}
        </div>

        {/* Doctors grid + pagination */}
        <div className='flex flex-col w-full gap-6'>
          {paginatedDocs.length > 0 ? (
            <div className='grid w-full gap-4 grid-cols-auto gap-y-6'>
              {paginatedDocs.map((item, index) => (
                <div
                  onClick={() => navigate(`/appointment/${item._id}`)}
                  className='border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500'
                  key={index}
                >
                  <img
                    className='object-cover w-full bg-blue-50'
                    src={`http://localhost:4000${item.image}`}
                    alt={item.name}
                  />
                  <div className='p-4'>
                    <div className='flex items-center gap-2 text-sm'>
                      {item.available
                        ? <div className='flex items-center gap-2 text-green-500'><p className='w-2 h-2 bg-green-500 rounded-full'></p><p>Available</p></div>
                        : <div className='flex items-center gap-2 text-gray-500'><p className='w-2 h-2 bg-gray-400 rounded-full'></p><p>Unavailable</p></div>
                      }
                    </div>
                    <p className='mt-1 text-lg font-medium text-gray-900'>{item.name}</p>
                    <p className='text-sm text-gray-600'>{item.speciality}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-sm text-gray-500'>No doctors found.</p>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex flex-wrap items-center justify-center gap-1 mt-2'>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className='px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all'
              >
                Prev
              </button>

              {getPageNumbers().map((page, idx) =>
                page === '...'
                  ? <span key={`ellipsis-${idx}`} className='px-2 py-1.5 text-gray-400 text-sm select-none'>…</span>
                  : <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1.5 text-sm border rounded transition-all ${currentPage === page ? 'bg-[#64748B] text-white border-[#64748B]' : 'border-gray-300 hover:bg-gray-100'}`}
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

          {/* Page info */}
          {filterDoc.length > 0 && (
            <p className='text-xs text-center text-gray-400'>
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filterDoc.length)} of {filterDoc.length} doctors
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Doctors
