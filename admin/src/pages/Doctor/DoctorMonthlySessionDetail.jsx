import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'

const getSessionStatusLabel = (item) => {
  if (item.status === 'cancelled') return { label: 'Cancelled', className: 'text-red-500' }
  if (item.sessionEnd) return { label: 'Completed', className: 'text-green-600' }
  if (item.sessionStart) return { label: 'Not Ended', className: 'text-amber-500' }
  // A past session with patients booked but never started means the doctor didn't hold it in time
  if (item.bookedPatientsCount > 0) return { label: 'Cancelled', className: 'text-red-500' }
  return { label: 'Not Started', className: 'text-gray-400' }
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const DoctorMonthlySessionDetail = () => {

  const { year, month } = useParams()
  const navigate = useNavigate()
  const { dToken, sessions, getSessions } = useContext(DoctorContext)
  const { currency } = useContext(AppContext)

  useEffect(() => {
    if (dToken) {
      getSessions()
    }
  }, [dToken])

  const yearNum = Number(year)
  const monthNum = Number(month)

  const monthSessions = useMemo(() => {
    return sessions.filter((item) => {
      const d = new Date(item.date)
      return d.getUTCFullYear() === yearNum && d.getUTCMonth() === monthNum
    }).sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [sessions, yearNum, monthNum])

  const handleExport = () => {
    const header = ['Date', 'Appointments', 'Status', 'Earnings']
    const rows = monthSessions.map((item) => [
      new Date(item.date).toLocaleDateString('en-GB'),
      `${item.bookedPatientsCount}/${item.maxPatients}`,
      getSessionStatusLabel(item).label,
      item.earnings || 0
    ])

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    ws['!cols'] = [
      { wch: 14 }, // Date
      { wch: 14 }, // Appointments
      { wch: 14 }, // Status
      { wch: 14 }, // Earnings
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sessions')
    XLSX.writeFile(wb, `session-history-${year}-${MONTH_NAMES[monthNum]}.xlsx`)
  }

  // Pagination
  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(monthSessions.length / PAGE_SIZE))
  const paginatedSessions = monthSessions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  // End pagination

  useEffect(() => {
    setPage(1)
  }, [year, month])

  return (
    <div className='w-full max-w-6xl m-5'>

      <div className='flex items-center gap-3 mb-3'>
        <button
          onClick={() => navigate('/doctor-monthly-summary')}
          className='flex items-center justify-center w-8 h-8 text-gray-500 transition-colors bg-white border rounded-lg hover:border-gray-300 hover:text-gray-800'
        >
          <ArrowLeft size={16} />
        </button>
        <p className='text-lg font-medium'>{MONTH_NAMES[monthNum]} {yearNum}</p>

        <button
          onClick={handleExport}
          className='flex items-center gap-1.5 px-3 py-1.5 ml-auto text-xs font-medium text-gray-600 transition-colors border rounded-lg hover:border-gray-300 hover:text-gray-800'
        >
          <Download size={14} /> Export
        </button>
      </div>

      <div className='overflow-hidden bg-white border rounded-xl text-sm max-h-[80vh] overflow-y-auto'>
        <div className='max-sm:hidden grid grid-cols-[1fr_1fr_1fr_1fr] gap-1 py-3 px-6 border-b bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>
          <p>Date</p>
          <p className='text-center'>Appointments</p>
          <p className='text-center'>Status</p>
          <p className='text-right'>Earnings</p>
        </div>

        {paginatedSessions.length === 0
          ? <p className='p-6 text-gray-500'>No sessions found for this month</p>
          : paginatedSessions.map((item) => (
            <div
              className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[1fr_1fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b last:border-0'
              key={item._id}
            >
              <p>{new Date(item.date).toLocaleDateString('en-GB')}</p>
              <p className='text-center'>{item.bookedPatientsCount}/{item.maxPatients}</p>
              <p className={`text-xs font-medium text-center ${getSessionStatusLabel(item).className}`}>
                {getSessionStatusLabel(item).label}
              </p>
              <p className={`text-right ${item.earnings ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>
                {currency}{(item.earnings || 0).toLocaleString()}
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

export default DoctorMonthlySessionDetail
