import React, { useContext, useEffect } from 'react'
import { ReceptionContext } from '../../context/ReceptionContext'

const convertTo12Hour = (time24) => {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`
}

const formatSessionDate = (date) => {
  const d = new Date(date)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}

const todayUTC = () => {
  const now = new Date()
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
}

const SessionsForReception = () => {

  const { rToken, sessions, getSessions } = useContext(ReceptionContext)

  useEffect(() => {
    if (rToken) {
      getSessions()
    }
  }, [rToken])

  const today = todayUTC()

  return (
    <div className='w-full max-w-6xl m-5'>

      <p className='mb-3 text-lg font-medium'>Doctor Sessions</p>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>

        {/* Header */}
        <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_2fr_2fr_1fr_1fr_1fr_1fr] gap-1 py-3 px-6 border-b font-medium text-gray-700'>
          <p>#</p>
          <p>Doctor</p>
          <p>Date</p>
          <p>Time</p>
          <p>Max</p>
          <p>Booked</p>
          <p>Available</p>
          <p>Status</p>
        </div>

        {sessions.length === 0 ? (
          <p className='py-6 text-center text-gray-400'>No sessions found</p>
        ) : (
          sessions.map((item, index) => {
            const available = item.maxPatients - item.bookedPatientsCount
            const isFull = available <= 0
            const sessionDay = new Date(item.date).setUTCHours(0, 0, 0, 0)
            const isPast = sessionDay < today

            return (
              <div
                key={item._id}
                className='flex flex-wrap justify-between max-sm:gap-2 sm:grid grid-cols-[0.5fr_2fr_2fr_2fr_1fr_1fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'
              >
                <p className='max-sm:hidden'>{index + 1}</p>
                <p className='font-medium text-gray-700'>{item.doctorName}</p>
                <p>{formatSessionDate(item.date)}</p>
                <p>
                  {convertTo12Hour(item.startTime)}
                  {item.endTime ? ` – ${convertTo12Hour(item.endTime)}` : ''}
                </p>
                <p>{item.maxPatients}</p>
                <p>{item.bookedPatientsCount}</p>
                <p className={isFull ? 'text-red-500 font-medium' : 'text-green-600 font-medium'}>
                  {isFull ? 'Full' : available}
                </p>
                <p>
                  {item.status === 'cancelled'
                    ? <span className='text-xs font-medium text-red-400'>Cancelled</span>
                    : isPast
                      ? <span className='text-xs font-medium text-gray-400'>Past</span>
                      : isFull
                        ? <span className='text-xs font-medium text-orange-500'>Full</span>
                        : <span className='text-xs font-medium text-green-500'>Active</span>
                  }
                </p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default SessionsForReception
