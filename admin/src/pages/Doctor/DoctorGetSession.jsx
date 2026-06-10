import React, { useContext, useEffect } from 'react'
import { DoctorContext } from '../../context/DoctorContext'

const DoctorGetSession = () => {

  const { dToken, sessions, getSessions } = useContext(DoctorContext)

  useEffect(() => {
    if (dToken) {
      getSessions()
    }
  }, [dToken])

  return (
    <div className='w-full max-w-6xl m-5'>

      <p className='mb-3 text-lg font-medium'>My Sessions</p>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_1.5fr_1fr_1fr_1fr_1fr_1fr] gap-1 py-3 px-6 border-b'>
          <p>#</p>
          <p>Date</p>
          <p>Start Time</p>
          <p>End Time</p>
          <p>Max Patients</p>
          <p>Booked</p>
          <p>Status</p>
        </div>

        {sessions.length === 0
          ? <p className='p-6 text-gray-500'>No sessions found</p>
          : sessions.map((item, index) => (
            <div className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_1.5fr_1fr_1fr_1fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={item._id}>
              <p className='max-sm:hidden'>{index + 1}</p>
              <p>{new Date(item.date).toLocaleDateString('en-GB')}</p>
              <p>{item.startTime}</p>
              <p>{item.endTime || '-'}</p>
              <p>{item.maxPatients}</p>
              <p>{item.bookedPatientsCount}</p>
              <p className={`text-xs font-medium ${item.status === 'cancelled' ? 'text-red-500' : 'text-green-600'}`}>
                {item.status}
              </p>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default DoctorGetSession
