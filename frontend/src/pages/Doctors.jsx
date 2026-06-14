import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { AppContext } from '../context/AppContext'

// Matches the grid's `minmax(200px, 1fr)` columns and `gap-4` (1rem) spacing
const CARD_MIN_WIDTH = 200
const GRID_GAP = 16
const ROWS_PER_PAGE = 2
const MIN_PAGE_SIZE = 6

// Derives the page size from the grid's actual rendered width so each page
// fills whole rows, regardless of screen size, zoom or display scaling.
const computePageSize = (containerWidth) => {
  const columns = Math.max(1, Math.floor((containerWidth + GRID_GAP) / (CARD_MIN_WIDTH + GRID_GAP)))
  return Math.max(MIN_PAGE_SIZE, columns * ROWS_PER_PAGE)
}

// "YYYY-MM-DD" key, matches the value format of <input type="date">
const formatDateKey = (year, month, day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

// session.date is stored as UTC midnight, so read it back using UTC getters
const getSessionDateKey = (session) => {
  const d = new Date(session.date)
  return formatDateKey(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

const Doctors = () => {
  const { speciality } = useParams()
  const [filterDoc, setFilterDoc] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(MIN_PAGE_SIZE)
  const [searchName, setSearchName] = useState('')
  const [selectedGender, setSelectedGender] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [availableDocIds, setAvailableDocIds] = useState(null)
  const [dateLoading, setDateLoading] = useState(false)
  const navigate = useNavigate()
  const { doctors, specialities, backendUrl } = useContext(AppContext)
  const gridWrapperRef = useRef(null)

  const today = new Date()
  const todayStr = formatDateKey(today.getFullYear(), today.getMonth(), today.getDate())

  useEffect(() => {
    const el = gridWrapperRef.current
    if (!el) return

    const updatePageSize = () => {
      const next = computePageSize(el.offsetWidth)
      setPageSize(prev => {
        if (prev !== next) setCurrentPage(1)
        return next
      })
    }

    updatePageSize()

    const observer = new ResizeObserver(updatePageSize)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Check which doctors have an open slot on the selected date
  useEffect(() => {
    if (!selectedDate) {
      setAvailableDocIds(null)
      return
    }

    let cancelled = false
    setDateLoading(true)

    Promise.all(
      doctors.map(doc =>
        axios.get(`${backendUrl}/api/doctor/sessions/${doc._id}`)
          .then(({ data }) => {
            const hasOpenSlot = data.success && data.sessions.some(session =>
              getSessionDateKey(session) === selectedDate && session.bookedPatientsCount < session.maxPatients
            )
            return hasOpenSlot ? doc._id : null
          })
          .catch(() => null)
      )
    ).then(ids => {
      if (cancelled) return
      setAvailableDocIds(new Set(ids.filter(Boolean)))
      setDateLoading(false)
    })

    return () => { cancelled = true }
  }, [selectedDate, doctors, backendUrl])

  const applyFilter = () => {
    let result = doctors

    if (speciality) {
      result = result.filter(doc => doc.speciality === speciality)
    }

    if (searchName.trim()) {
      const query = searchName.trim().toLowerCase()
      result = result.filter(doc => doc.name.toLowerCase().includes(query))
    }

    if (selectedGender) {
      result = result.filter(doc => doc.gender === selectedGender)
    }

    if (selectedDate && availableDocIds) {
      result = result.filter(doc => availableDocIds.has(doc._id))
    }

    setFilterDoc(result)
    setCurrentPage(1)
  }

  useEffect(() => {
    applyFilter()
  }, [doctors, speciality, searchName, selectedGender, selectedDate, availableDocIds])

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
      <div className='flex flex-col w-full gap-3 p-4 mt-4 bg-white border border-gray-200 shadow-sm rounded-xl lg:flex-row lg:flex-wrap lg:items-center'>
        <div className='relative w-full lg:flex-1 lg:min-w-[240px]'>
          <svg className='absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z' />
          </svg>
          <input
            type='text'
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder='Search by name'
            className='w-full py-2 pl-9 pr-3 text-sm bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white focus:border-[#64748B] focus:ring-1 focus:ring-[#64748B]'
          />
        </div>

        <select
          value={speciality || ''}
          onChange={(e) => navigate(e.target.value ? `/doctors/${e.target.value}` : '/doctors')}
          className='w-full lg:w-48 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white focus:border-[#64748B] focus:ring-1 focus:ring-[#64748B]'
        >
          <option value=''>All Specialities</option>
          {specialities.map(item => (
            <option key={item.speciality} value={item.speciality}>{item.speciality}</option>
          ))}
        </select>

        <select
          value={selectedGender}
          onChange={(e) => setSelectedGender(e.target.value)}
          className='w-full lg:w-32 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white focus:border-[#64748B] focus:ring-1 focus:ring-[#64748B]'
        >
          <option value=''>All Genders</option>
          <option value='Male'>Male</option>
          <option value='Female'>Female</option>
        </select>

        <input
          type='date'
          value={selectedDate}
          min={todayStr}
          onChange={(e) => setSelectedDate(e.target.value)}
          className='w-full lg:w-40 px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg outline-none focus:bg-white focus:border-[#64748B] focus:ring-1 focus:ring-[#64748B]'
        />

        {selectedDate && (
          <button
            onClick={() => setSelectedDate('')}
            className='px-3 py-2 text-sm transition-all border border-gray-300 rounded-lg hover:bg-gray-100'
          >
            Clear date
          </button>
        )}
      </div>

      <div ref={gridWrapperRef} className='flex flex-col w-full gap-6 mt-5'>
        {dateLoading ? (
          <p className='text-sm text-gray-400'>Checking availability...</p>
        ) : paginatedDocs.length > 0 ? (
          <div
            className='grid w-full gap-4 gap-y-6'
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
          >
            {paginatedDocs.map((item, index) => (
              <div
                onClick={() => navigate(`/appointment/${item._id}`)}
                className='flex flex-col items-center w-full max-w-xs gap-2 p-5 text-center transition-all duration-300 bg-white border border-gray-200 cursor-pointer rounded-2xl hover:-translate-y-1 hover:shadow-lg justify-self-center'
                key={index}
              >
                <img src={`${backendUrl}${item.image}`} alt={item.name} className='object-cover w-24 h-24 rounded-full ring-4 ring-blue-50 bg-blue-50' />
                {item.gender && (
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.gender.toLowerCase() === 'female' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'}`}>
                    {item.gender}
                  </span>
                )}
                <p className='font-semibold text-gray-900'>{item.name}</p>
                <p className='text-sm text-gray-500'>{item.speciality}</p>
                <span className={`flex items-center gap-1 text-xs font-medium ${item.available ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${item.available ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  {item.available ? 'Available' : 'Unavailable'}
                </span>
                <span className='px-3 py-1 mt-1 text-xs font-medium rounded-full bg-primary/10 text-primary'>Book Appointment</span>
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
              className='px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all'
            >
              Prev
            </button>

            {getPageNumbers().map((page, idx) =>
              page === '...'
                ? <span key={`ellipsis-${idx}`} className='px-1.5 py-1 sm:px-2 sm:py-1.5 text-gray-400 text-xs sm:text-sm select-none'>…</span>
                : <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm border rounded transition-all ${currentPage === page ? 'bg-[#64748B] text-white border-[#64748B]' : 'border-gray-300 hover:bg-gray-100'}`}
                  >
                    {page}
                  </button>
            )}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className='px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all'
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
  )
}

export default Doctors
