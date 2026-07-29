import React from 'react'
import { AdminContext } from '../../context/AdminContext'
import { useRef, useState, useEffect } from "react";
import { useContext } from 'react'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import {
  Stethoscope, UserCheck, Users,
  CalendarDays, CalendarCheck, CalendarClock, CalendarX,
  Layers, ListChecks, Hourglass, XCircle,
  Wallet, TrendingUp, Undo2,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PieChart, Pie, Cell, Legend } from 'recharts';
import { ClipboardMinus } from 'lucide-react';
import html2pdf from 'html2pdf.js'


const StatCard = ({ icon: Icon, value, label }) => (
  <div className='flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200'>
    <div className='flex items-center justify-center w-11 h-11 shrink-0 rounded-lg border border-gray-200 bg-gray-50 text-gray-700'>
      <Icon className='w-5 h-5' strokeWidth={1.75} />
    </div>
    <div className='min-w-0'>
      <p className='text-xl font-semibold text-gray-800 leading-tight truncate'>{value}</p>
      <p className='text-xs text-gray-500 truncate'>{label}</p>
    </div>
  </div>
)

const Dashboard = () => {

  const { aToken, getDashData, cancelAppointment, dashData, monthlyRevenue, getMonthlyRevenue, appointmentBySpeciallity, SpecialtyPieChart } = useContext(AdminContext)
  const { slotDateFormat, currency } = useContext(AppContext)


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

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return dashData && (
    <div className='m-5'>
      <p className='text-lg font-semibold text-gray-700 mb-4'>{today}</p>

      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>

        <StatCard icon={Stethoscope} value={dashData.doctors} label='Doctors' />
        <StatCard icon={UserCheck} value={dashData.availableDoctors} label='Available Doctors' />
        <StatCard icon={Users} value={dashData.patientsThisMonth} label='Patients (This Month)' />

        <StatCard icon={CalendarDays} value={dashData.totalAppointmentsThisMonth} label='Total Appointments' />
        <StatCard icon={CalendarCheck} value={dashData.completedAppointmentsThisMonth} label='Completed Appointments' />
        <StatCard icon={CalendarClock} value={dashData.upcomingAppointmentsThisMonth} label='Upcoming Appointments' />
        <StatCard icon={CalendarX} value={dashData.cancelledAppointmentsThisMonth} label='Cancelled Appointments' />

        <StatCard icon={Layers} value={dashData.sessionsThisMonth} label='Sessions (This Month)' />
        <StatCard icon={ListChecks} value={dashData.completedSessionsThisMonth} label='Completed Sessions' />
        <StatCard icon={Hourglass} value={dashData.upcomingSessionsThisMonth} label='Upcoming Sessions' />
        <StatCard icon={XCircle} value={dashData.cancelledSessionsThisMonth} label='Cancelled Sessions' />

        <StatCard icon={Wallet} value={`${currency}${dashData.earningsThisMonth}`} label='Earnings (This Month)' />
        <StatCard icon={TrendingUp} value={`${currency}${dashData.profitThisMonth}`} label='Profit (This Month)' />
        <StatCard icon={Undo2} value={`${currency}${dashData.refundsThisMonth}`} label='Refunds (This Month)' />

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
