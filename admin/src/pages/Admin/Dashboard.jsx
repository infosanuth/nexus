import React from 'react'
import { AdminContext } from '../../context/AdminContext'
import { useRef, useState, useEffect } from "react";
import { useContext } from 'react'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import {
  Stethoscope, UserCheck, Users,
  CalendarDays, CalendarCheck, CalendarClock, CalendarX, PercentCircle,
  Layers, ListChecks, Hourglass, XCircle,
  Wallet, TrendingUp, Undo2,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { PieChart, Pie, Cell, Legend } from 'recharts';


const TONE_STYLES = {
  neutral: { icon: 'text-gray-600 bg-gray-100' },
  indigo: { icon: 'text-indigo-600 bg-indigo-50' },
  cyan: { icon: 'text-cyan-600 bg-cyan-50' },
  blue: { icon: 'text-blue-600 bg-blue-50' },
  slate: { icon: 'text-slate-600 bg-slate-100' },
  emerald: { icon: 'text-emerald-600 bg-emerald-50' },
  amber: { icon: 'text-amber-600 bg-amber-50' },
  red: { icon: 'text-red-600 bg-red-50' },
  teal: { icon: 'text-teal-600 bg-teal-50' },
  rose: { icon: 'text-rose-600 bg-rose-50' },
  orange: { icon: 'text-orange-600 bg-orange-50' },
}

const formatPercent = (value) => `${Number(value ?? 0).toFixed(1)}%`

const StatCard = ({ icon: Icon, value, label, tone = 'neutral' }) => {
  const t = TONE_STYLES[tone] || TONE_STYLES.neutral
  return (
    <div className='flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200'>
      <div className={`flex items-center justify-center rounded-lg w-11 h-11 shrink-0 ${t.icon}`}>
        <Icon className='w-5 h-5' strokeWidth={1.75} />
      </div>
      <div className='min-w-0'>
        <p className='text-xl font-semibold leading-tight text-gray-800 truncate'>{value}</p>
        <p className='text-xs text-gray-500 truncate'>{label}</p>
      </div>
    </div>
  )
}

const Dashboard = () => {

  const { aToken, getDashData, cancelAppointment, dashData, monthlyRevenue, getMonthlyRevenue, appointmentBySpeciallity, SpecialtyPieChart, appointmentByChannel, ChannelPieChart } = useContext(AdminContext)
  const { slotDateFormat, currency } = useContext(AppContext)


  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFD', '#FF6384', '#36A2EB'];

  const CHANNEL_COLORS = ['#2563EB', '#DC2626']; // blue = Online, red = Walk-in

  const renderPercentLabel = (colors) => ({ cx, cy, midAngle, outerRadius, percent, index }) => {
    const RADIAN = Math.PI / 180
    const radius = outerRadius + 18
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text
        x={x}
        y={y}
        fill={colors[index % colors.length]}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={13}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  useEffect(() => {
    if (aToken) {
      getDashData()
      getMonthlyRevenue()
      SpecialtyPieChart()
      ChannelPieChart()
    }
  }, [aToken])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return dashData && (
    <div className='m-5'>
      <p className='mb-4 text-lg font-semibold text-gray-700'>{today}</p>

      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>

        <StatCard icon={Stethoscope} value={dashData.doctors} label='Doctors' tone='indigo' />
        <StatCard icon={UserCheck} value={dashData.availableDoctors} label='Available Doctors' tone='cyan' />
        <StatCard icon={Users} value={dashData.patientsThisMonth} label='Patients (This Month)' tone='blue' />

        <StatCard icon={CalendarDays} value={dashData.totalAppointmentsThisMonth} label='Total Appointments' tone='slate' />
        <StatCard icon={CalendarCheck} value={dashData.completedAppointmentsThisMonth} label='Completed Appointments' tone='emerald' />
        <StatCard icon={CalendarClock} value={dashData.upcomingAppointmentsThisMonth} label='Upcoming Appointments' tone='amber' />
        <StatCard icon={CalendarX} value={dashData.cancelledAppointmentsThisMonth} label='Cancelled Appointments' tone='red' />
        <StatCard icon={PercentCircle} value={formatPercent(dashData.cancelRateThisMonth)} label='Cancel Rate (This Month)' tone='orange' />

        <StatCard icon={Layers} value={dashData.sessionsThisMonth} label='Sessions (This Month)' tone='slate' />
        <StatCard icon={ListChecks} value={dashData.completedSessionsThisMonth} label='Completed Sessions' tone='emerald' />
        <StatCard icon={Hourglass} value={dashData.upcomingSessionsThisMonth} label='Upcoming Sessions' tone='amber' />
        <StatCard icon={XCircle} value={dashData.cancelledSessionsThisMonth} label='Cancelled Sessions' tone='red' />

        <StatCard icon={Wallet} value={`${currency}${dashData.earningsThisMonth}`} label='Earnings (This Month)' tone='teal' />
        <StatCard icon={TrendingUp} value={`${currency}${dashData.profitThisMonth}`} label='Profit (This Month)' tone='emerald' />
        <StatCard icon={Undo2} value={`${currency}${dashData.refundsThisMonth}`} label='Refunds (This Month)' tone='rose' />

      </div >

      <div className="grid grid-cols-1 gap-6 mt-8 lg:grid-cols-2">

        <div id="invoice2" className="flex flex-col p-6 bg-white border rounded-lg shadow-sm border-slate-200 h-96">
          <div className="mb-2">
            <p className="text-lg font-semibold text-gray-800">Appointments by Channel</p>
            <p className="mt-1 text-sm text-slate-600">Online vs walk-in bookings this month</p>
          </div>

          <div style={{ width: '100%', height: 300 }}>
            {appointmentByChannel.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appointmentByChannel}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    labelLine={false}
                    label={renderPercentLabel(CHANNEL_COLORS)}
                  >
                    {appointmentByChannel.map((entry, index) => (
                      <Cell key={`channel-cell-${index}`} fill={CHANNEL_COLORS[index % CHANNEL_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) =>
                      [`${value} appointments`, name]
                    }
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="mt-10 text-center text-gray-500">No appointment data available</p>
            )}
          </div>
        </div>

        <div id="invoice1" className="flex flex-col p-6 bg-white border rounded-lg shadow-sm border-slate-200 h-96">
          <div className="mb-2">
            <p className="text-lg font-semibold text-gray-800">Appointments by Speciality Report</p>
            <p className="mt-1 text-sm text-slate-600">Appointment volume across specialities</p>
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
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    labelLine={false}
                    label={renderPercentLabel(COLORS)}
                  >
                    {appointmentBySpeciallity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) =>
                      [`${value} appointments`, name]
                    }
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="mt-10 text-center text-gray-500">No appointment data available</p>
            )}
          </div>
        </div>

      </div>

      <div className="mt-6">
        <div id="invoice" className="flex flex-col w-full p-6 bg-white border rounded-lg shadow-sm border-slate-200 h-96">
          <div className="flex items-center justify-between mb-6">
            <div className=''>
              <p className='text-lg font-semibold '>Revenue Chart</p>
              <p className="mt-1 text-sm text-slate-600">Monthly Revenue</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="text-sm font-medium text-slate-900">Revenue</div>
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
                  cursor={false}
                  formatter={(value) => `Rs. ${value.toLocaleString()}`}
                  contentStyle={{ fontSize: 14, borderRadius: 8, borderColor: '#e2e8f0' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={24} activeBar={{ fill: '#2563eb' }} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm font-medium text-gray-400">
              No revenue data available
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
