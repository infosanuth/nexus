import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Search, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'

const DoctorSessionAppointmentsHistory = () => {

  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { dToken, sessionDetails, sessionAppointments, getSessionAppointments } = useContext(DoctorContext)
  const { calculateAge } = useContext(AppContext)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (dToken && sessionId) {
      getSessionAppointments(sessionId)
    }
  }, [dToken, sessionId])

  const filteredAppointments = sessionAppointments.filter((item) => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return String(item.ref || '').includes(term) || item.userData?.name?.toLowerCase().includes(term)
  })

  const handleExport = () => {
    const header = ['Ref', 'Patient', 'Age', 'Gender', 'Status']
    const rows = filteredAppointments.map((item) => [
      item.ref || '-',
      item.userData.name,
      item.userData.age || calculateAge(item.userData.dob),
      item.userData.gender || 'Not Selected',
      item.isCompleted ? 'Completed' : 'Not Completed'
    ])

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    ws['!cols'] = [
      { wch: 10 }, // Ref
      { wch: 24 }, // Patient
      { wch: 8 },  // Age
      { wch: 12 }, // Gender
      { wch: 14 }, // Status
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Appointments')
    XLSX.writeFile(wb, `session-appointments-${sessionId}.xlsx`)
  }

  // Pagination
  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE))
  const paginatedAppointments = filteredAppointments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  // End pagination

  useEffect(() => {
    setPage(1)
  }, [search])

  return (
    <div className='w-full max-w-6xl m-5'>

      <div className='flex items-center gap-3 mb-3'>
        <button
          onClick={() => navigate('/doctor-session-history')}
          className='flex items-center justify-center w-8 h-8 text-gray-500 transition-colors bg-white border rounded-lg hover:border-gray-300 hover:text-gray-800'
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className='text-lg font-medium'>Session Appointments History</p>
          {sessionDetails && (
            <p className='text-xs text-gray-400'>
              {new Date(sessionDetails.date).toLocaleDateString('en-GB')} &middot; {sessionDetails.startTime}{sessionDetails.endTime ? ` - ${sessionDetails.endTime}` : ''}
            </p>
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
            className='w-full py-1.5 pl-8 pr-8 text-sm border rounded-lg focus:outline-none focus:border-primary'
          />
          {search && (
            <button onClick={() => setSearch('')} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500'>
              <X size={13} />
            </button>
          )}
        </div>

        <button
          onClick={handleExport}
          className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors border rounded-lg hover:border-gray-300 hover:text-gray-800'
        >
          <Download size={14} /> Export
        </button>

      </div>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_1fr_2fr_1fr_1fr_1fr] gap-1 py-3 px-6 border-b'>
          <p>#</p>
          <p>Ref</p>
          <p>Patient</p>
          <p className='text-center'>Age</p>
          <p>Gender</p>
          <p className='text-center'>Status</p>
        </div>

        {paginatedAppointments.length === 0
          ? <p className='p-6 text-gray-500'>{search ? 'No matching appointments' : 'No appointments booked for this session'}</p>
          : paginatedAppointments.map((item, index) => (
            <div className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_1fr_2fr_1fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={item._id}>
              <p className='max-sm:hidden'>{(page - 1) * PAGE_SIZE + index + 1}</p>
              <p>{item.ref || '-'}</p>
              <p>{item.userData.name}</p>
              <p className='text-center'>{item.userData.age || calculateAge(item.userData.dob)}</p>
              <p>{item.userData.gender || 'Not Selected'}</p>
              <p className={`text-xs font-medium text-center ${item.isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                {item.isCompleted ? 'Completed' : 'Not Completed'}
              </p>
            </div>
          ))
        }
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

export default DoctorSessionAppointmentsHistory
