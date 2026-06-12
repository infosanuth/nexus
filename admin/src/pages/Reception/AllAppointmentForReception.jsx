import React, { useContext, useEffect } from 'react'
import { ReceptionContext } from '../../context/ReceptionContext'
import { AppContext } from '../../context/AppContext'

const AllAppointmentForReception = () => {

  const { rToken, appointments, getAppointments } = useContext(ReceptionContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)

  useEffect(() => {
    if (rToken) {
      getAppointments()
    }
  }, [rToken])

  return (
    <div className='w-full max-w-6xl m-5'>

      <p className='mb-3 text-lg font-medium'>All Appointments</p>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_1.5fr_2fr_1fr_2fr_1fr_1fr_1fr] gap-1 py-3 px-6 border-b font-medium'>
          <p>#</p>
          <p>Patient</p>
          <p>Phone</p>
          <p>Doctor</p>
          <p>Type</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p>Payment</p>
          <p>Status</p>
        </div>

        {appointments.length === 0 ? (
          <p className='py-6 text-center text-gray-400'>No appointments found</p>
        ) : (
          [...appointments].reverse().map((item, index) => (
            <div
              className='flex flex-wrap justify-between max-sm:gap-2 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1.5fr_2fr_1fr_2fr_1fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'
              key={item._id}
            >
              <p className='max-sm:hidden'>{index + 1}</p>
              <p>{item.userData?.name || 'N/A'}</p>
              <p>{item.userData?.phoneNumber || item.userData?.phone || '-'}</p>
              <p>{item.docData?.name || 'N/A'}</p>
              <p>{item.userData?.isWalkIn ? 'Walk-in' : 'Online'}</p>
              <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
              <p>{currency}{item.amount}</p>
              <p className={item.payment ? 'text-green-600' : 'text-red-500'}>
                {item.payment ? 'Paid' : 'Unpaid'}
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
    </div>
  )
}

export default AllAppointmentForReception
