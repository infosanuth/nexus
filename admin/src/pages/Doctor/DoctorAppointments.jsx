import React from 'react'
import { useEffect } from 'react'
import { useContext } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import html2pdf from 'html2pdf.js'
import { ClipboardMinus } from 'lucide-react';

const DoctorAppointments = () => {

  const { dToken, appointments, getAppointments, completeAppointment, cancelAppointment } = useContext(DoctorContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  const paidAppointments = appointments.filter(item => item.payment);

  // const doctorAppointments = getAppointments.filter(item => item.docId === '6862c6a04ddeaff35517f931')

  async function handleOnClick() {
    const element = document.querySelector('#invoice')
    html2pdf(element)
  }



  useEffect(() => {
    if (dToken) {
      getAppointments()
    }
  }, [dToken])

  return (
    <>
      <div className='w-full max-w-6xl m-5 '>

        <p className='mb-3 text-lg font-medium'>All Appointments</p>

        <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
          <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 py-3 px-6 border-b'>
            <p>#</p>
            <p>Patient</p>
            <p>Payment</p>
            <p>Age</p>
            <p>Date & Time</p>
            <p>Fees</p>
            <p>Action</p>
          </div>

          {appointments.reverse().map((item, index) => (
            <div className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
              <p className='max-sm:hidden'>{index + 1}</p>
              <div className='flex items-center gap-2'>
                <img src={`http://localhost:4000${item.userData.image}`} className='w-8 rounded-full' alt="" /> <p>{item.userData.name}</p>
              </div>
              <div>
                <p className='text-xs inline border border-primary px-2 rounded-full'>
                  {item.payment ? 'Online' : 'CASH'}
                </p>
              </div>
              <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
              <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
              <p>{currency}{item.amount}</p>
              {item.cancelled
                ? <p className='text-red-400 text-xs font-medium'>Cancelled</p>
                : item.isCompleted
                  ? <p className='text-green-500 text-xs font-medium'>Completed</p>
                  : <div className='flex'>
                    <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />
                    <img onClick={() => completeAppointment(item._id)} className='w-10 cursor-pointer' src={assets.tick_icon} alt="" />
                  </div>
              }
            </div>
          ))
          }
        </div>
      </div>

      <div className='hidden'>
        <div id="invoice" className="w-full max-w-6xl p-8 font-sans bg-white text-gray-800 text-sm leading-relaxed">

  {/* Header section: Date on left, Title in center */}
  <div className="flex justify-between items-center mb-6 border-b pb-4">
    <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
    <h1 className="text-xl font-semibold text-center flex-grow -ml-24">All Appointments</h1>
  </div>

  {/* Table header */}
  <div className="grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-2 px-4 py-3 bg-gray-100 border-y font-medium">
    <p>#</p>
    <p>Patient</p>
    <p>Payment</p>
    <p>Age</p>
    <p>Date & Time</p>
    <p>Fees</p>
    <p>Status</p>
  </div>

  {/* Table rows */}
  {appointments.reverse().map((item, index) => (
    <div
      key={index}
      className="grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-2 px-4 py-2 border-b"
    >
      <p>{index + 1}</p>
      <div className="flex items-center gap-2">
        <img
          src={`http://localhost:4000${item.userData.image}`}
          alt=""
          className="w-6 h-6 rounded-full object-cover"
        />
        <span>{item.userData.name}</span>
      </div>
      <p className="text-xs  px-2 py-0.5  text-center w-fit">
        {item.payment ? 'Online' : 'CASH'}
      </p>
      <p>{calculateAge(item.userData.dob)}</p>
      <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
      <p>{currency}{item.amount}</p>
      <p className={`text-xs font-medium ${item.cancelled ? 'text-red-500' : item.isCompleted ? 'text-green-600' : 'pl-1 text-blue-500'}`}>
        {item.cancelled
          ? 'Cancelled'
          : item.isCompleted
            ? 'Completed'
            : 'Pending'}
      </p>
    </div>
  ))}
</div>



      </div>
      <button onClick={handleOnClick} className="fixed right-5 bottom-5 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        <ClipboardMinus size={20} />
        Generate Report
      </button>
    </>

  )
}

export default DoctorAppointments
