import React from 'react'
import { useEffect, useState } from 'react'
import { useContext } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'

const DoctorAppointments = () => {

  const { dToken, appointments, getAppointments } = useContext(DoctorContext)
  const { slotDateFormat, calculateAge } = useContext(AppContext)

  useEffect(() => {
    if (dToken) {
      getAppointments()
    }
  }, [dToken])

  // Pagination
  const PAGE_SIZE = 10
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(appointments.length / PAGE_SIZE))
  const paginatedAppointments = appointments.reverse().slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  // End pagination

  return (
    <div className='w-full max-w-6xl m-5'>

      <p className='mb-3 text-lg font-medium'>All Appointments</p>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.4fr_0.8fr_1.6fr_0.6fr_0.9fr_1.1fr_1.8fr_1fr] gap-1 py-3 px-6 border-b'>
          <p>#</p>
          <p>Ref</p>
          <p>Patient</p>
          <p>Age</p>
          <p>Gender</p>
          <p>Phone Number</p>
          <p>Date & Time</p>
          <p>Method</p>
        </div>

        {paginatedAppointments.map((item, index) => (
          <div className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.4fr_0.8fr_1.6fr_0.6fr_0.9fr_1.1fr_1.8fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
            <p className='max-sm:hidden'>{index + 1}</p>
            <p>{item.ref || '-'}</p>
            <p>{item.userData.name}</p>
            <p className='max-sm:hidden'>{item.userData.age || calculateAge(item.userData.dob)}</p>
            <p>{item.userData.gender || 'Not Selected'}</p>
            <p>{item.userData.phoneNumber || '-'}</p>
            <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
            <div>
              <p className='inline px-2 text-xs border rounded-full border-primary'>
                {item.isWalkIn ? 'Walk-in' : 'Online'}
              </p>
            </div>
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

export default DoctorAppointments
