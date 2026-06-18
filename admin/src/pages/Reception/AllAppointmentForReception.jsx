import React, { useContext, useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { ReceptionContext } from '../../context/ReceptionContext'
import { AppContext } from '../../context/AppContext'

const AllAppointmentForReception = () => {

  const { rToken, appointments, getAppointments } = useContext(ReceptionContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (rToken) {
      getAppointments()
    }
  }, [rToken])

  const filtered = appointments.filter((item) => {
    if (!search.trim()) return true
    const term = search.trim().toLowerCase()
    return (
      item.userData?.name?.toLowerCase().includes(term) ||
      item.docData?.name?.toLowerCase().includes(term)
    )
  })

  return (
    <div className='w-full max-w-6xl m-5'>

      <div className='flex items-center justify-between mb-3'>
        <p className='text-lg font-medium'>All Appointments</p>
        <div className='relative w-72'>
          <Search size={14} className='absolute text-gray-400 -translate-y-1/2 left-3 top-1/2' />
          <input
            type='text'
            placeholder='Search by patient or doctor...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full py-1.5 pl-8 pr-8 text-sm border rounded focus:outline-none focus:border-primary'
          />
          {search && (
            <button onClick={() => setSearch('')} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500'>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

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

        {filtered.length === 0 ? (
          <p className='py-6 text-center text-gray-400'>No appointments found</p>
        ) : (
          [...filtered].reverse().map((item, index) => (
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
