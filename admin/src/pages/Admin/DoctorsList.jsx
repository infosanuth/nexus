import React, { useContext, useEffect } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { ClipboardMinus } from 'lucide-react';
import html2pdf from 'html2pdf.js'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import {useState } from 'react'

const DoctorsList = () => {

  const { doctors, aToken, getAllDoctors, changeAvailability } = useContext(AdminContext)

  const [appointments, setAppointments] = useState([])

  const navigate = useNavigate()

  useEffect(() => {
    if (aToken) {
      getAllDoctors()
    }

  }, [aToken])

  async function handleOnClick() {
    const element = document.querySelector('#invoice')
    html2pdf(element)
  }

  const backendUrl = import.meta.env.VITE_BACKEND_URL

  const getAppointmentsByDoctor = async (docId) => {
    try {
      const { data } = await axios.post(backendUrl + '/api/admin/appointments-doctor', { docId }, { headers: { aToken } }
      )

      if (data.success) {
        setAppointments(data.appointments)
        console.log("Appointments:", data.appointments)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
      console.log(error)
    }
  }


  return (
    <div>
      <div className='m-5 max-h-[90vh] overflow-y-scroll'>
        <h1 className='text-lg font-medium'>All Doctors</h1>
        <div className='w-full flex flex-wrap gap-4 pt-5 gap-y-6'>
          {
            doctors.map((item, index) => (
              <div 
                className='border border-indigo-200 rounded-xl max-w-56 overflow-hidden cursor-pointer group hover:translate-y-[-10px] transition-all duration-500' key={index}>
                {/* <img className='bg-indigo-50 group-hover:bg-[#5F6FFF] transition-all dru5' src={item.image} alt="" /> */}
                <img className='bg-indigo-50 ' src={`http://localhost:4000${item.image}`} alt="" />
                <div className='p-4'>
                  <p className='text-neutral-800 text-lg font-medium'>{item.name}</p>
                  <p className='text-zinc-600 text-sm'>{item.speciality}</p>
                  <div className='mt-2 flex items-center gap-1 text-sm'>
                    <input className="accent-blue-600" onChange={() => changeAvailability(item._id)} type="checkbox" checked={item.available} />
                    <p>Available</p>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>


      <div className='hidden'>
        <div id="invoice" className="p-6 text-sm text-black font-sans relative min-h-[100vh]">

          {/* Date - top left */}
          <div className="mb-2">
            <p id="report-date" className="m-0 text-sm">Date: 2025-08-01</p>
          </div>

          {/* Title - centered */}
          <h2 className="text-center text-xl font-semibold mb-6">Doctor List</h2>

          {/* Table header */}
          <div className="grid grid-cols-[40px_1.5fr_2fr_1fr] border-t border-b border-gray-300 font-medium bg-gray-100 py-2 px-4">
            <div>#</div>
            <div>Name</div>
            <div>Specialty</div>
            <div>Available</div>
          </div>

          {/* Appointment rows */}
          {doctors.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-[40px_1.5fr_2fr_1fr] border-b border-gray-200 py-2 px-4 items-center"
            >
              <p>{index + 1}</p>
              <p>{item.name}</p>
              <div>{item.speciality}</div>
              <div>{item.available ? "Yes" : "No"}</div>
            </div>
          ))}

             {/* onClick={() => {navigate(`/appointments/${item._id}`)}} */}
        </div>
      </div>


      <button onClick={handleOnClick} className="fixed right-5 bottom-5 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        <ClipboardMinus size={20} />
        Generate Report
      </button>
    </div>

  )
}

export default DoctorsList


