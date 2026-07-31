import React, { useContext, useEffect } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import {
  CalendarDays, CalendarCheck, CalendarClock, CalendarX, ArrowRightLeft,
  Layers, ListChecks, Hourglass, XCircle, Wallet,
} from 'lucide-react'
import { todayUTC } from '../../utils/date'

const StatCard = ({ icon: Icon, value, label }) => {
  return (
    <div className='flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200'>
      <div className='flex items-center justify-center rounded-lg w-11 h-11 shrink-0 text-slate-700 bg-slate-100'>
        <Icon className='w-5 h-5' strokeWidth={1.75} />
      </div>
      <div className='min-w-0'>
        <p className='text-xl font-semibold leading-tight truncate text-slate-900'>{value}</p>
        <p className='text-xs truncate text-slate-500'>{label}</p>
      </div>
    </div>
  )
}

const getSessionStatusLabel = (item) => {
  if (item.status === 'cancelled') return { label: 'Cancelled', className: 'text-red-500' }
  if (item.sessionEnd) return { label: 'Completed', className: 'text-green-600' }
  if (item.sessionStart) return { label: 'Not Ended', className: 'text-amber-500' }
  return { label: 'Not Started', className: 'text-slate-400' }
}

const DoctorDashboard = () => {

  const { dToken, dashData, getDashData, sessions, getSessions } = useContext(DoctorContext)
  const { currency } = useContext(AppContext)

  useEffect(() => {
    if (dToken) {
      getDashData()
      getSessions()
    }
  }, [dToken])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const todayBoundary = todayUTC()

  const upcomingSessions = sessions
    .filter((item) => item.status === 'active' && new Date(item.date).setUTCHours(0, 0, 0, 0) >= todayBoundary)
    .sort((a, b) => (new Date(a.date) - new Date(b.date)) || a.startTime.localeCompare(b.startTime))
    .slice(0, 5)

  const pastSessions = sessions
    .filter((item) => new Date(item.date).setUTCHours(0, 0, 0, 0) < todayBoundary)
    .sort((a, b) => (new Date(b.date) - new Date(a.date)) || b.startTime.localeCompare(a.startTime))
    .slice(0, 5)

  return dashData && (
    <div className='m-5'>
      <p className='mb-4 text-lg font-semibold text-slate-700'>{today}</p>

      <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>

        <StatCard icon={CalendarDays} value={dashData.totalAppointmentsThisMonth} label='Total Appointments' />
        <StatCard icon={CalendarCheck} value={dashData.completedAppointmentsThisMonth} label='Completed Appointments' />
        <StatCard icon={CalendarClock} value={dashData.upcomingAppointmentsThisMonth} label='Upcoming Appointments' />
        <StatCard icon={CalendarX} value={dashData.cancelledAppointmentsThisMonth} label='Cancelled Appointments' />
        <StatCard icon={ArrowRightLeft} value={dashData.rescheduledAppointmentsThisMonth} label='Rescheduled Appointments' />

        <StatCard icon={Layers} value={dashData.sessionsThisMonth} label='Total Session' />
        <StatCard icon={ListChecks} value={dashData.completedSessionsThisMonth} label='Completed Session' />
        <StatCard icon={Hourglass} value={dashData.upcomingSessionsThisMonth} label='Upcoming Session' />
        <StatCard icon={XCircle} value={dashData.cancelledSessionsThisMonth} label='Cancel Session' />
        <StatCard icon={Wallet} value={`${currency}${dashData.earningsThisMonth}`} label='Earnings' />

      </div>

      <div className='grid grid-cols-1 gap-4 mt-6 lg:grid-cols-2'>

        <div className='overflow-hidden bg-white border rounded-xl border-slate-200'>
          <div className='px-4 py-3 border-b border-slate-100'>
            <p className='text-sm font-semibold text-slate-700'>Upcoming Sessions</p>
          </div>
          <div className='max-sm:hidden grid grid-cols-[1.2fr_1fr_1fr] gap-1 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50'>
            <p>Date</p>
            <p>Start Time</p>
            <p className='text-right'>Appointments</p>
          </div>
          {upcomingSessions.length === 0 ? (
            <p className='px-4 py-6 text-sm text-center text-slate-400'>No upcoming sessions</p>
          ) : (
            upcomingSessions.map((item) => (
              <div key={item._id} className='grid grid-cols-[1.2fr_1fr_1fr] gap-1 items-center px-4 py-2.5 text-sm text-slate-600 border-b border-slate-100 last:border-0'>
                <p>{new Date(item.date).toLocaleDateString('en-GB')}</p>
                <p>{item.startTime}</p>
                <p className='text-right'>{item.bookedPatientsCount}/{item.maxPatients}</p>
              </div>
            ))
          )}
        </div>

        <div className='overflow-hidden bg-white border rounded-xl border-slate-200'>
          <div className='px-4 py-3 border-b border-slate-100'>
            <p className='text-sm font-semibold text-slate-700'>Past Sessions</p>
          </div>
          <div className='max-sm:hidden grid grid-cols-[1.2fr_1fr_1fr] gap-1 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-50'>
            <p>Date</p>
            <p>Status</p>
            <p className='text-right'>Earnings</p>
          </div>
          {pastSessions.length === 0 ? (
            <p className='px-4 py-6 text-sm text-center text-slate-400'>No past sessions</p>
          ) : (
            pastSessions.map((item) => (
              <div key={item._id} className='grid grid-cols-[1.2fr_1fr_1fr] gap-1 items-center px-4 py-2.5 text-sm text-slate-600 border-b border-slate-100 last:border-0'>
                <p>{new Date(item.date).toLocaleDateString('en-GB')}</p>
                <p className={`text-xs font-medium ${getSessionStatusLabel(item).className}`}>{getSessionStatusLabel(item).label}</p>
                <p className='text-right'>{currency}{(item.earnings || 0).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}

export default DoctorDashboard
