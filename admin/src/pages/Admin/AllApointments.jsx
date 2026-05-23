import React, { useEffect, useRef } from 'react'
import { useContext } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import html2pdf from 'html2pdf.js'
import { ClipboardMinus } from 'lucide-react';


const AllApointments = () => {

  const { aToken, appointments, getAllAppointments, cancelAppointment } = useContext(AdminContext)
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  
  const pAppointments = appointments.filter(item => item.payment);
  const paidCount = pAppointments.length;

  const pendingappointment = appointments.filter(item =>!item.cancelled)

  

  const missedAppointments = appointments.filter((a) => {
  const [day, month, year] = a.slotDate.split("_");
  const dateObj = new Date(`${year}-${month}-${day}`);
  const today = new Date();
  return !a.isCompleted && dateObj < today && !a.cancelled;
});

  useEffect(() => {
    if (aToken) {
      getAllAppointments()
    }
  }, [aToken])

  async function handleOnClick() {
    const element = document.querySelector('#invoice')
    html2pdf(element)
  }

  const getDoctorAppointmentCount = (appointments) => {
    const counts = {};
    appointments.forEach((appt) => {
      const docName = appt.docData.name;
      if (!counts[docName]) {
        counts[docName] = 1;
      } else {
        counts[docName]++;
      }
    });
    return counts;
  };

  const doctorCounts = getDoctorAppointmentCount(pendingappointment);


  return (
    <>
      <div className='w-full max-w-6xl  m-5'>

        <div>
          <p className='mb-3 text-lg font-medium'>All Appointments </p>

          <div className='bg-white border rounded text-sm max-h-[80vh] min-h-[60vh] overflow-y-scroll'>
            <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b'>
              <p>#</p>
              <p>Patient</p>
              <p>Age</p>
              <p>Date & Time</p>
              <p>Doctor</p>
              <p>Fees</p>
              <p>Action</p>
            </div>

            {appointments.map((item, index) => (
              <div className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
                <p className='max-sm:hidden'>{index + 1}</p>
                <div className='flex items-center gap-2'>
                  <img src={`http://localhost:4000${item.userData.image}`} className='w-8 rounded-full' alt="" /> <p>{item.userData.name}</p>
                </div>
                <p className='max-sm:hidden'>{calculateAge(item.userData.dob)}</p>
                <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
                <div className='flex items-center gap-2'>
                  <img src={`http://localhost:4000${item.docData.image}`} className='w-8 rounded-full bg-gray-200' alt="" /> <p>{item.docData.name}</p>
                </div>
                <p>{currency}{item.amount}</p>
                {item.cancelled ? <p className='text-red-400 text-xs font-medium'>Cancelled</p> : item.isCompleted ? <p className='text-green-500 text-xs font-medium'>Completed</p> : <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />}
              </div>
            ))}
          </div>
        </div>

        <div className="hidden">
          <div id="invoice" className="p-6 text-sm text-black font-sans relative min-h-[100vh]">

            {/* Date - top left */}
            <div className="mb-2">
              <p id="report-date" className="m-0 text-sm">Date: 2025-08-01</p>
            </div>

            {/* Title - centered */}
            <h2 className="text-center text-xl font-semibold mb-6">All Appointments</h2>

            {/* Table header */}
            <div className="grid grid-cols-[40px_1.5fr_60px_2fr_2fr_60px] border-t border-b border-gray-300 font-medium bg-gray-100 py-2 px-4">
              <p>#</p>
              <p>Patient</p>
              <p>Age</p>
              <p>Date & Time</p>
              <p>Doctor</p>
              <p>Fees</p>
            </div>

            {/* Appointment rows */}
            {appointments.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-[40px_1.5fr_60px_2fr_2fr_60px] border-b border-gray-200 py-2 px-4 items-center"
              >
                <p>{index + 1}</p>
                <p>{item.userData.name}</p>
                <p>{calculateAge(item.userData.dob)}</p>
                <p>{slotDateFormat(item.slotDate)}, {item.slotTime}</p>
                <p>{item.docData.name}</p>
                <p>{currency}{item.amount}</p>
              </div>
            ))}


          </div>
        </div>



        <button onClick={handleOnClick} className="fixed left-50 bottom-5 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          <ClipboardMinus size={20} />
          Generate Report
        </button>

      </div>

      <div className="p-4 " >
        <h2 className="text-xl font-semibold mb-4">Appointments Per Doctor</h2>
        <table className="w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2 text-left">#</th>
              <th className="border px-4 py-2 text-left">Doctor Name</th>
              <th className="border px-4 py-2 text-left">Total Appointments</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(doctorCounts).map(([docName, count], index) => (
              <tr className='bg-white' key={docName}>
                <td className="border px-4 py-2">{index + 1}</td>
                <td className="border px-4 py-2">{docName}</td>
                <td className="border px-4 py-2">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      
    </>

  )


}

export default AllApointments
