import React, { useContext, useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { ReceptionContext } from '../../context/ReceptionContext'
import { AppContext } from '../../context/AppContext'

const RescheduledAppointmentsForReception = () => {

  const { rToken, appointments, getAppointments } = useContext(ReceptionContext)
  const { slotDateFormat } = useContext(AppContext)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (rToken) {
      getAppointments()
    }
  }, [rToken])

  // Only appointments that have actually been rescheduled carry a previous slot
  const rescheduled = appointments.filter((item) => item.reSchedule && item.previousSlotDate)

  const filtered = rescheduled.filter((item) => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return (
      String(item.ref || '').toLowerCase().includes(term) ||
      item.userData?.name?.toLowerCase().includes(term) ||
      item.docData?.name?.toLowerCase().includes(term)
    )
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
  }, [search])

  return (
    <div className='w-full max-w-6xl m-5'>

      <div className='flex flex-wrap items-center justify-between gap-3 mb-3'>
        <p className='text-lg font-medium'>Rescheduled Appointments</p>
        <div className='relative w-64'>
          <Search size={14} className='absolute text-gray-400 -translate-y-1/2 left-3 top-1/2' />
          <input
            type='text'
            placeholder='Search by ref, patient, or doctor...'
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
        <div className='max-sm:hidden grid grid-cols-[0.5fr_1fr_2fr_2fr_2fr_2fr_1fr] gap-1 py-3 px-6 border-b font-medium'>
          <p>#</p>
          <p>Ref</p>
          <p>Patient</p>
          <p>Doctor</p>
          <p>Previous Date & Time</p>
          <p>New Date & Time</p>
          <p>Status</p>
        </div>

        {sorted.length === 0 ? (
          <p className='py-6 text-center text-gray-400'>No rescheduled appointments found</p>
        ) : (
          paginated.map((item, index) => (
            <div
              className='flex flex-wrap justify-between max-sm:gap-2 max-sm:text-base sm:grid grid-cols-[0.5fr_1fr_2fr_2fr_2fr_2fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'
              key={item._id}
            >
              <p className='max-sm:hidden'>{(page - 1) * PAGE_SIZE + index + 1}</p>
              <p>{item.ref || '-'}</p>
              <p>{item.userData?.name || 'N/A'}</p>
              <p>{item.docData?.name || 'N/A'}</p>
              <p className='text-red-400 line-through decoration-red-300'>
                {slotDateFormat(item.previousSlotDate)}, {item.previousSlotTime}
              </p>
              <p className='font-medium text-gray-700'>
                {slotDateFormat(item.slotDate)}, {item.slotTime}
              </p>
              {item.cancelled
                ? <p className='text-xs font-medium text-red-400'>Cancelled</p>
                : item.isCompleted
                  ? <p className='text-xs font-medium text-green-500'>Completed</p>
                  : <p className='text-xs font-medium text-blue-500'>Pending</p>
              }
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

export default RescheduledAppointmentsForReception
