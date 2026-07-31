import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Check, Clock, Download, Play, Search, Square, Users, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { ReceptionContext } from '../../context/ReceptionContext'
import { AppContext } from '../../context/AppContext'

const ReceptionSessionAppointments = () => {

  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { rToken, sessionDetails, sessionAppointments, getSessionAppointments, completeSessionAppointment, startSession, endSession } = useContext(ReceptionContext)
  const { calculateAge } = useContext(AppContext)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (rToken && sessionId) {
      getSessionAppointments(sessionId)
    }
  }, [rToken, sessionId])

  const filteredAppointments = sessionAppointments.filter((item) => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return String(item.ref || '').includes(term) || item.userData?.name?.toLowerCase().includes(term)
  })

  const completedCount = sessionAppointments.filter(item => item.isCompleted).length

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
      item.isCompleted ? 'Completed' : 'Not Completed'
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
          onClick={() => navigate('/reception-sessions')}
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

        {/* Session controls */}
        <div className='flex items-center gap-2 ml-2'>
          <button
            onClick={() => startSession(sessionId)}
            disabled={sessionDetails?.sessionStart}
            className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 transition-colors bg-white border border-green-300 rounded-lg shadow-sm hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white'
          >
            <Play size={13} /> Start Session
          </button>
          <button
            onClick={() => endSession(sessionId)}
            disabled={!sessionDetails?.sessionStart || sessionDetails?.sessionEnd}
            className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors bg-white border border-red-200 rounded-lg shadow-sm hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white'
          >
            <Square size={13} /> End Session
          </button>
        </div>

        {/* Stats */}
        <div className='flex items-center gap-2'>
          <div className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border rounded-lg shadow-sm'>
            <Users size={13} className='text-primary' /> {sessionAppointments.length} Booked
          </div>
          <div className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border rounded-lg shadow-sm'>
            <Check size={13} className='text-green-600' /> {completedCount} Completed
          </div>
          <div className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border rounded-lg shadow-sm'>
            <Clock size={13} className='text-amber-600' /> {sessionAppointments.length - completedCount} Pending
          </div>
        </div>

        {/* Search */}
        <div className='relative ml-auto w-52'>
          <Search size={14} className='absolute text-gray-400 -translate-y-1/2 left-3 top-1/2' />
          <input
            type='text'
            placeholder='Search by ref or name'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full py-2 pl-8 pr-8 text-sm bg-white border rounded-lg shadow-sm focus:outline-none focus:border-primary'
          />
          {search && (
            <button onClick={() => setSearch('')} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500'>
              <X size={13} />
            </button>
          )}
        </div>

        <button
          onClick={handleExport}
          // className='hidden items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors bg-white border rounded-lg shadow-sm hover:border-gray-300 hover:text-gray-800'
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
          <p className='text-center'>Action</p>
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
                <div className='flex justify-center'>
                  <button
                    onClick={() => !item.isCompleted && completeSessionAppointment(item._id, sessionId)}
                    title={item.isCompleted ? 'Completed' : 'Mark as completed'}
                    className={`flex items-center justify-center w-8 h-8 rounded-full border transition-colors ${item.isCompleted
                      ? 'bg-green-100 border-green-200 text-green-600 cursor-default'
                      : 'border-gray-200 text-gray-300 hover:border-primary hover:text-primary cursor-pointer'
                      }`}
                  >
                    <Check size={15} />
                  </button>
                </div>
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

export default ReceptionSessionAppointments
