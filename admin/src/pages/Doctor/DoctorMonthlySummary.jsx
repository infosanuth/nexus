import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'

const getSessionStatusValue = (item) => {
  if (item.status === 'cancelled') return 'cancelled'
  if (item.sessionEnd) return 'completed'
  if (item.sessionStart) return 'not-ended'
  // A past session with patients booked but never started means the doctor didn't hold it in time
  if (item.bookedPatientsCount > 0) return 'cancelled'
  return 'not-started'
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const DoctorMonthlySummary = () => {

  const { dToken, sessions, getSessions } = useContext(DoctorContext)
  const { currency } = useContext(AppContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (dToken) {
      getSessions()
    }
  }, [dToken])

  const monthlySummary = useMemo(() => {
    const now = new Date()
    const currentMonthStart = Date.UTC(now.getFullYear(), now.getMonth(), 1)

    const buckets = new Map()

    sessions.forEach((item) => {
      const d = new Date(item.date)
      const year = d.getUTCFullYear()
      const month = d.getUTCMonth()

      // Only fully completed calendar months count as "past"
      if (Date.UTC(year, month, 1) >= currentMonthStart) return

      const key = `${year}-${month}`
      if (!buckets.has(key)) {
        buckets.set(key, {
          key, year, month,
          totalSessions: 0,
          completeSessions: 0,
          cancelSessions: 0,
          notStartedSessions: 0,
          totalAppointments: 0,
          earnings: 0,
        })
      }

      const bucket = buckets.get(key)
      const status = getSessionStatusValue(item)

      bucket.totalSessions += 1
      if (status === 'completed') bucket.completeSessions += 1
      else if (status === 'cancelled') bucket.cancelSessions += 1
      else bucket.notStartedSessions += 1
      bucket.totalAppointments += item.bookedPatientsCount || 0
      bucket.earnings += item.earnings || 0
    })

    return [...buckets.values()].sort((a, b) => (b.year - a.year) || (b.month - a.month))
  }, [sessions])

  // Pagination
  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(monthlySummary.length / PAGE_SIZE))
  const paginatedSummary = monthlySummary.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  // End pagination

  useEffect(() => {
    setPage(1)
  }, [sessions])

  const handleExport = () => {
    const header = ['Month', 'Total Session', 'Complete Session', 'Cancel Session', 'Not Started Session', 'Total Appointment', 'Earnings']
    const rows = monthlySummary.map((item) => [
      `${item.year} ${MONTH_NAMES[item.month]}`,
      item.totalSessions,
      item.completeSessions,
      item.cancelSessions,
      item.notStartedSessions,
      item.totalAppointments,
      item.earnings
    ])

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    ws['!cols'] = [
      { wch: 14 }, // Month
      { wch: 14 }, // Total Session
      { wch: 16 }, // Complete Session
      { wch: 14 }, // Cancel Session
      { wch: 18 }, // Not Started Session
      { wch: 16 }, // Total Appointment
      { wch: 14 }, // Earnings
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Summary')
    XLSX.writeFile(wb, `monthly-summary-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className='w-full max-w-6xl m-5'>

      <div className='flex items-center justify-between mb-3'>
        <p className='text-lg font-medium'>Monthly Summary</p>
        <button
          onClick={handleExport}
          className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors border rounded-lg hover:border-gray-300 hover:text-gray-800'
        >
          <Download size={14} /> Export
        </button>
      </div>

      <div className='overflow-hidden bg-white border rounded-xl text-sm max-h-[80vh] overflow-y-auto'>
        <div className='max-sm:hidden grid grid-cols-[1.2fr_1fr_1.2fr_1fr_1.3fr_1.3fr_1fr] gap-1 py-3 px-6 border-b bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>
          <p>Month</p>
          <p className='text-center'>Total Session</p>
          <p className='text-center'>Complete Session</p>
          <p className='text-center'>Cancel Session</p>
          <p className='text-center'>Not Started Session</p>
          <p className='text-center'>Total Appointment</p>
          <p className='text-right'>Earnings</p>
        </div>

        {monthlySummary.length === 0
          ? <p className='p-6 text-gray-500'>No past months found</p>
          : paginatedSummary.map((item) => (
            <div
              onClick={() => navigate(`/doctor-monthly-summary/${item.year}/${item.month}`)}
              className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[1.2fr_1fr_1.2fr_1fr_1.3fr_1.3fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b last:border-0 transition-colors hover:bg-gray-50 cursor-pointer'
              key={item.key}
            >
              <p className='font-medium text-gray-800'>{item.year} {MONTH_NAMES[item.month]}</p>
              <p className='text-center'>{item.totalSessions}</p>
              <p className='text-center text-green-600'>{item.completeSessions}</p>
              <p className='text-center text-red-500'>{item.cancelSessions}</p>
              <p className='text-center text-gray-400'>{item.notStartedSessions}</p>
              <p className='text-center'>{item.totalAppointments}</p>
              <p className={`text-right ${item.earnings ? 'font-semibold text-gray-800' : 'text-gray-400'}`}>
                {currency}{item.earnings.toLocaleString()}
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

export default DoctorMonthlySummary
