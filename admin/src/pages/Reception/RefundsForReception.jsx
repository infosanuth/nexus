import React, { useContext, useEffect } from 'react'
import { ReceptionContext } from '../../context/ReceptionContext'
import { AppContext } from '../../context/AppContext'

const RefundsForReception = () => {

  const { rToken, appointments, getAppointments, requestRefund } = useContext(ReceptionContext)
  const { slotDateFormat, currency } = useContext(AppContext)

  useEffect(() => {
    if (rToken) {
      getAppointments()
    }
  }, [rToken])

  // Only cancelled, paid appointments are eligible for a refund
  const refundable = appointments.filter((item) => item.cancelled && item.payment)

  return (
    <div className='w-full max-w-6xl m-5'>

      <p className='mb-3 text-lg font-medium'>Refunds</p>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_2fr_2fr_1fr_1fr_1.5fr] gap-1 py-3 px-6 border-b font-medium'>
          <p>#</p>
          <p>Patient</p>
          <p>Doctor</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p>Status</p>
          <p>Action</p>
        </div>

        {refundable.length === 0 ? (
          <p className='py-6 text-center text-gray-400'>No refunds to process</p>
        ) : (
          [...refundable].reverse().map((item, index) => (
            <div
              className='flex flex-wrap justify-between max-sm:gap-2 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_2fr_2fr_1fr_1fr_1.5fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50'
              key={item._id}
            >
              <p className='max-sm:hidden'>{index + 1}</p>
              <p>{item.userData?.name || 'N/A'}</p>
              <p>{item.docData?.name || 'N/A'}</p>
              <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
              <p>{currency}{item.amount}</p>
              {item.refundPayment
                ? <p className='text-xs font-medium text-green-500'>Refunded</p>
                : item.refund
                  ? <p className='text-xs font-medium text-yellow-500'>Requested</p>
                  : <p className='text-xs font-medium text-red-400'>Not Requested</p>
              }
              {item.refundPayment ? (
                <p className='text-xs text-gray-400'>-</p>
              ) : (
                <button
                  onClick={() => requestRefund(item._id)}
                  className='px-3 py-1 text-xs text-white bg-[#64748B] rounded hover:opacity-90 w-fit'
                >
                  Refund Request
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default RefundsForReception
