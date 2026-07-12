import React from 'react'
import { AdminContext } from '../../context/AdminContext'
import { useRef, useState, useEffect } from "react";
import { useContext } from 'react'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import { UserRoundPen, CalendarSearch, SquareUserRound, DollarSign, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PieChart, Pie, Cell, Legend } from 'recharts';
import { ClipboardMinus } from 'lucide-react';
import html2pdf from 'html2pdf.js'


const Dashboard = () => {

  const { aToken, getDashData, cancelAppointment, dashData, monthlyRevenue, getMonthlyRevenue, appointmentBySpeciallity, SpecialtyPieChart } = useContext(AdminContext)
  const { slotDateFormat } = useContext(AppContext)


  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFD', '#FF6384', '#36A2EB'];

  useEffect(() => {
    if (aToken) {
      getDashData()
      getMonthlyRevenue()
      SpecialtyPieChart()
    }
  }, [aToken])

  async function handleOnClick() {
    const element = document.querySelector('#invoice')
    const opt = {
      margin: [0, 0, 0, 0],
      filename: 'Revenue_Report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } // landscape looks better for charts
    };

    html2pdf().set(opt).from(element).save();
    // html2pdf(element)
  }

  async function handleOnClick1() {
    const element = document.querySelector('#invoice1')
    const opt = {
      margin: [0, 0, 0, 0],
      filename: 'Appointments_by_Speciality_Report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } // landscape looks better for charts
    };

    html2pdf().set(opt).from(element).save();
    // html2pdf(element1)
  }

  return dashData && (
    <div className='m-5'>
      <div className=' flex flex-wrap gap-3'>

        <div className='flex items-center gap-3 bg-white p-4 min-w-60 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200 '>
          {/* <img className='w-14' src={assets.doctor_icon} alt="" /> */}
          <UserRoundPen className='w-10 h-9 border border-slate-100  text-blue-700 bg-slate-100 rounded-xl p-1.5' />
          <div >
            <p className='text-xl font-semibold text-gray-600'>{dashData.doctors}</p>
            <p className='text-sm text-gray-400'>Doctors</p>
          </div>
        </div>

        <div className='flex items-center gap-3 bg-white p-4 min-w-60 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200'>
          {/* <img className='w-14' src={assets.appointments_icon} alt="" /> */}
          <CalendarSearch className='w-10 h-9 border border-indigo-100 text-purple-500 bg-purple-100 rounded-xl p-1.5' />
          <div >
            <p className='text-xl font-semibold text-gray-600'>{dashData.appointments}</p>
            <p className='text-sm text-gray-400'>Appointments</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-4 min-w-60 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200">
          {/* <img className='w-14' src={assets.patients_icon} alt="" /> */}
          <SquareUserRound className="w-10 h-9 text-indigo-600 bg-indigo-100 border border-indigo-200 rounded-xl p-1.5" />
          <div>
            <p className="text-xl font-semibold text-gray-800">{dashData.patients}</p>
            <p className="text-sm text-gray-400">Patients</p>
          </div>
        </div>


        <div className="flex items-center gap-3 bg-white p-4 min-w-60 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200">
          {/* <img className='w-14' src={assets.patients_icon} alt="" /> */}
          <DollarSign className='w-10 h-9  border-green-100 text-[#00C49F] bg-green-100 rounded-xl p-1.5' />
          <div>
            <p className='text-xl font-semibold text-gray-600'>{dashData.totalRevenueForCurrentMonth}</p>
            <p className='text-sm text-gray-400'>Total Revenue</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white p-4 min-w-60 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all duration-200">
          {/* <img className='w-14' src={assets.patients_icon} alt="" /> */}
          <Users className='w-10 h-9  border-sky-100 text-sky-600 bg-sky-100 rounded-xl p-1.5' />
          <div>
            <p className='text-xl font-semibold text-gray-600'>26</p>
            <p className='text-sm text-gray-400'>Active Users</p>
          </div>
        </div>

      </div >


      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">
        <div className="xl:col-span-2">
          <div id="invoice" className="bg-white border border-slate-200 rounded-lg shadow-sm h-96 p-6 flex flex-col w-full">
            <div className="flex items-center justify-between mb-6">
              <div className=''>
                <p className=' text-lg font-semibold'>Revenue Chart</p>
                <p className="text-sm text-slate-600 mt-1">Monthly Revenue</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <div className="text-sm font-medium text-slate-900">Revenue</div>
                  <button onClick={handleOnClick} className='-mt-0.5' id="108"><ClipboardMinus /></button>
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            {monthlyRevenue && monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: '500' }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={false}
                    padding={{ left: 10, right: 10 }}
                  />
                  <YAxis
                    tickFormatter={(value) => value.toLocaleString()}
                    ticks={[10000, 20000, 30000, 40000]}
                    domain={[0, 40000]}
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: '500' }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip
                    formatter={(value) => `Rs. ${value.toLocaleString()}`}
                    contentStyle={{ fontSize: 14, borderRadius: 8, borderColor: '#e2e8f0' }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full text-gray-400 text-sm font-medium">
                No revenue data available
              </div>
            )}
          </div>
        </div>



        <div id="invoice1" className="bg-white border border-slate-200 rounded-lg shadow-sm h-96 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Appointments by Speciality</h2>
            <button onClick={handleOnClick1} className="-mt-0.5" id="108">
              <ClipboardMinus />
            </button>
          </div>

          <div style={{ width: '100%', height: 300 }}>
            {appointmentBySpeciallity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appointmentBySpeciallity}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {appointmentBySpeciallity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) =>
                      [`${value} appointments`, name]
                    }
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 mt-10">No appointment data available</p>
            )}
          </div>
        </div>


      </div>






      <div className='bg-white'>
        <div className='flex items-center gap-2.5 px-4 py-4 mt-6 rounded-t border '>
          <img src={assets.list_icon} alt="" />
          <p className='font-semibold'>Latest Bookings</p>
        </div>

        <div className='pt-4 border border-t-0'>
          {dashData.latestAppointments.slice(0, 5).map((item, index) => (
            <div className='flex items-center px-6 py-3 gap-3 hover:bg-gray-100' key={index}>
              <img className='rounded-full w-10' src={`http://localhost:4000${item.docData.image}`} alt="" />
              <div className='flex-1 text-sm'>
                <p className='text-gray-800 font-medium'>{item.docData.name}</p>
                <p className='text-gray-600 '>Booking on {slotDateFormat(item.slotDate)}</p>
              </div>
              {item.cancelled ? <p className='text-red-400 text-xs font-medium'>Cancelled</p> : item.isCompleted ? <p className='text-green-500 text-xs font-medium'>Completed</p> : <img onClick={() => cancelAppointment(item._id)} className='w-10 cursor-pointer' src={assets.cancel_icon} alt="" />}
            </div>
          ))}
        </div>
      </div>







    </div>
  )
}

export default Dashboard
