import React, { useContext, useEffect, useRef, useState } from 'react'
import { CalendarDays, Search, X } from 'lucide-react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { dateInputToUTC } from '../../utils/date'

const slotDateToUTC = (slotDate) => {
  const [d, m, y] = slotDate.split('_').map(Number)
  return Date.UTC(y, m - 1, d)
}

const DoctorNoShows = () => {

  const { dToken, noShows, getNoShows } = useContext(DoctorContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  const [search, setSearch] = useState('')
  const [specificDate, setSpecificDate] = useState('')
  const dateInputRef = useRef(null)

  useEffect(() => {
    if (dToken) {
      getNoShows()
    }
  }, [dToken])

  const handleDateInput = (e) => {
    setSpecificDate(e.target.value)
  }

  const clearSpecificDate = () => {
    setSpecificDate('')
    if (dateInputRef.current) dateInputRef.current.value = ''
  }

  const isFiltered = specificDate || search

  const resetFilters = () => {
    setSpecificDate('')
    setSearch('')
    if (dateInputRef.current) dateInputRef.current.value = ''
  }

  const filtered = noShows.filter((item) => {
    const term = search.trim().toLowerCase()
    if (term && !(String(item.ref || '').toLowerCase().includes(term) || item.userData?.name?.toLowerCase().includes(term))) return false

    if (specificDate && slotDateToUTC(item.slotDate) !== dateInputToUTC(specificDate)) return false

    return true
  })

  const sorted = [...filtered].reverse()

  // Pagination
  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  // End pagination

  useEffect(() => {
    setPage(1)
  }, [search, specificDate])

  return (
    <div className='w-full max-w-6xl m-5'>

      <p className='mb-3 text-lg font-medium'>No-Shows</p>

      <div className='flex items-center gap-3 px-5 py-3 mb-3 overflow-x-auto bg-white border rounded-xl'>
        <div className='flex items-center gap-2 shrink-0'>
          <span className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>Date</span>
          <div className='relative flex items-center'>
            <button
              type='button'
              onClick={() => dateInputRef.current?.showPicker()}
              title='Pick a specific date'
              className={`p-1.5 rounded-lg border transition-colors ${specificDate
                ? 'border-primary/30 text-primary bg-primary/10'
                : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                }`}
            >
              <CalendarDays size={14} />
            </button>
            <input
              ref={dateInputRef}
              type='date'
              value={specificDate}
              onChange={handleDateInput}
              className='absolute w-0 h-0 opacity-0 pointer-events-none'
            />
            {specificDate && (
              <span className='ml-2 flex items-center gap-1 text-xs text-primary border border-primary/30 bg-primary/10 rounded-lg px-2.5 py-1 font-medium whitespace-nowrap'>
                {new Date(specificDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                <button onClick={clearSpecificDate} className='transition-colors hover:text-red-400'>
                  <X size={11} />
                </button>
              </span>
            )}
          </div>
        </div>

        {isFiltered && (
          <button
            onClick={resetFilters}
            className='flex items-center gap-1 text-xs text-gray-400 transition-colors shrink-0 whitespace-nowrap hover:text-red-400'
          >
            <X size={12} /> Clear
          </button>
        )}

        <div className='relative flex-1 min-w-[160px] max-w-64 ml-auto'>
          <Search size={14} className='absolute text-gray-400 -translate-y-1/2 left-3 top-1/2' />
          <input
            type='text'
            placeholder='Search by ref or patient...'
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
      </div>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.4fr_0.8fr_1.6fr_0.6fr_1.8fr_1fr] gap-1 py-3 px-6 border-b font-medium'>
          <p>#</p>
          <p>Ref</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Amount</p>
        </div>

        {sorted.length === 0 ? (
          <p className='py-6 text-center text-gray-400'>No no-shows found</p>
        ) : (
          paginated.map((item, index) => (
            <div
              className='flex flex-wrap justify-between max-sm:gap-2 max-sm:text-base sm:grid grid-cols-[0.4fr_0.8fr_1.6fr_0.6fr_1.8fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'
              key={item._id}
            >
              <p className='max-sm:hidden'>{(page - 1) * PAGE_SIZE + index + 1}</p>
              <p>{item.ref || '-'}</p>
              <p>{item.userData?.name}</p>
              <p className='max-sm:hidden'>{item.userData?.age || calculateAge(item.userData?.dob)}</p>
              <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
              <p>{currency} {item.amount}</p>
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

export default DoctorNoShows
