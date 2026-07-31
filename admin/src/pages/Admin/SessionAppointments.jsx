import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Download, Search, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const getAppointmentStatus = (item) => {
  if (item.cancelled) return 'Cancelled'
  if (item.isCompleted) return 'Completed'
  return 'Not Completed'
}

const SessionAppointments = () => {

  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { aToken, sessionDetails, sessionAppointments, getSessionAppointments } = useContext(AdminContext)
  const { calculateAge } = useContext(AppContext)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (aToken && sessionId) {
      getSessionAppointments(sessionId)
    }
  }, [aToken, sessionId])

  const filteredAppointments = sessionAppointments.filter((item) => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return String(item.ref || '').includes(term) || item.userData?.name?.toLowerCase().includes(term)
  })

  // Pagination
  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE))
  const paginatedAppointments = filteredAppointments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  // End pagination

  useEffect(() => {
    setPage(1)
  }, [search])

  const handleExport = () => {
    const header = ['Ref', 'Patient', 'Age', 'Gender', 'Token', 'Status']
    const rows = filteredAppointments.map((item) => [
      item.ref || '-',
      item.userData.name,
      item.userData.age || calculateAge(item.userData.dob),
      item.userData.gender || 'Not Selected',
      item.tokenNumber || '-',
      getAppointmentStatus(item)
    ])

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    ws['!cols'] = [
      { wch: 10 }, // Ref
      { wch: 24 }, // Patient
      { wch: 8 },  // Age
      { wch: 12 }, // Gender
      { wch: 8 },  // Token
      { wch: 14 }, // Status
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Appointments')
    XLSX.writeFile(wb, `session-appointments-${sessionId}.xlsx`)
  }

  return (
    <div className='w-full max-w-6xl m-5'>

      <div className='flex flex-wrap items-center gap-3 mb-4'>
        <button
          onClick={() => navigate(-1)}
          className='flex items-center justify-center text-gray-500 transition-colors bg-white border rounded-lg shadow-sm w-9 h-9 hover:border-gray-300 hover:text-gray-800'
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className='text-lg font-semibold text-gray-800'>Session Appointments</p>
          {sessionDetails && (
            <div className='flex items-center gap-3 mt-0.5 text-xs text-gray-400'>
              <span>{sessionDetails.doctorName}</span>
              <span className='flex items-center gap-1'>
                <Calendar size={12} /> {new Date(sessionDetails.date).toLocaleDateString('en-GB')}
              </span>
              <span className='flex items-center gap-1'>
                <Clock size={12} /> {sessionDetails.startTime}{sessionDetails.endTime ? ` - ${sessionDetails.endTime}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Search */}
        <div className='relative w-64 ml-auto'>
          <Search size={14} className='absolute text-gray-400 -translate-y-1/2 left-3 top-1/2' />
          <input
            type='text'
            placeholder='Search by ref or name'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full py-1.5 pl-8 pr-8 text-sm bg-white border rounded-lg shadow-sm focus:outline-none focus:border-primary'
          />
          {search && (
            <button onClick={() => setSearch('')} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500'>
              <X size={13} />
            </button>
          )}
        </div>

        <button
          onClick={handleExport}
          className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors bg-white border rounded-lg shadow-sm hover:border-gray-300 hover:text-gray-800'
        >
          <Download size={14} /> Export
        </button>

      </div>

      <div className='overflow-hidden bg-white border shadow-sm rounded-xl'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_1fr_2fr_1fr_1fr_1fr_1fr] gap-1 py-3 px-6 bg-gray-50 border-b text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>
          <p>#</p>
          <p>Ref</p>
          <p>Patient</p>
          <p className='text-center'>Age</p>
          <p>Gender</p>
          <p className='text-center'>Token</p>
          <p className='text-center'>Status</p>
        </div>

        <div className='max-h-[65vh] overflow-y-scroll'>
          {paginatedAppointments.length === 0
            ? <p className='p-6 text-sm text-gray-500'>{search ? 'No matching appointments' : 'No appointments booked for this session'}</p>
            : paginatedAppointments.map((item, index) => (
              <div className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_1fr_2fr_1fr_1fr_1fr_1fr] gap-1 items-center text-sm text-gray-500 py-3 px-6 border-b last:border-b-0 hover:bg-gray-50/80 transition-colors' key={item._id}>
                <p className='max-sm:hidden'>{(page - 1) * PAGE_SIZE + index + 1}</p>
                <p className='font-medium text-gray-600'>{item.ref || '-'}</p>
                <p className='text-gray-700'>{item.userData.name}</p>
                <p className='text-center'>{item.userData.age || calculateAge(item.userData.dob)}</p>
                <p>{item.userData.gender || 'Not Selected'}</p>
                <div className='flex justify-center'>
                  <span className='px-2.5 py-1 text-xs font-semibold text-primary bg-primary/10 border border-primary/30 rounded-md'>
                    {item.tokenNumber || '-'}
                  </span>
                </div>
                <p className='text-xs font-medium text-center text-gray-600'>
                  {getAppointmentStatus(item)}
                </p>
              </div>
            ))
          }
        </div>
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

export default SessionAppointments
