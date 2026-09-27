import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Check, ChevronDown, Clock } from 'lucide-react'
import { DoctorContext } from '../../context/DoctorContext'
import { getPeriodStartUTC, PERIOD_OPTIONS } from '../../utils/date'

const slotDateToUTC = (slotDate) => {
  const [d, m, y] = slotDate.split('_').map(Number)
  return Date.UTC(y, m - 1, d)
}

const colors = ['blue', 'green']

const DoctorBookingType = () => {
  const { dToken, appointments, getAppointments } = useContext(DoctorContext)
  const [period, setPeriod] = useState('all')
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false)
  const periodDropdownRef = useRef(null)

  useEffect(() => { if (dToken) getAppointments() }, [dToken])

  // Close the period dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target)) {
        setIsPeriodDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const data = useMemo(() => {
    const periodStart = getPeriodStartUTC(period)
    const paid = appointments.filter((item) =>
      item.payment && !item.isWalkIn &&
      (periodStart === null || slotDateToUTC(item.slotDate) >= periodStart)
    )
    const self = paid.filter((item) => item.bookedForSelf).length
    const other = paid.length - self
    return [{ name: 'Self', value: self }, { name: 'Other', value: other }]
  }, [appointments, period])

  const [self, other] = data.map((item) => item.value)
  const total = self + other

  return (
    <div className='w-full max-w-6xl m-5'>
      <p className='mb-4 text-lg font-medium'>Booking Type</p>

      <div className='flex items-center justify-end mb-4'>
        <div className='relative shrink-0' ref={periodDropdownRef}>
          <button
            type='button'
            onClick={() => setIsPeriodDropdownOpen((open) => !open)}
            className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors border rounded-lg hover:border-gray-300 hover:text-gray-800'
          >
            <Clock size={14} />
            Period: {PERIOD_OPTIONS.find((opt) => opt.value === period)?.label}
            <ChevronDown size={14} />
          </button>
          {isPeriodDropdownOpen && (
            <div className='absolute right-0 z-10 mt-1 overflow-hidden bg-white border rounded-lg shadow-lg top-full w-44'>
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type='button'
                  onClick={() => { setPeriod(opt.value); setIsPeriodDropdownOpen(false) }}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-gray-100 ${period === opt.value ? 'text-primary font-medium' : 'text-gray-600'}`}
                >
                  {opt.label}
                  {period === opt.value && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3'>
        <div className='p-4 bg-white border border-gray-200 rounded-xl'>
          <p className='text-xl font-semibold text-gray-800'>{total}</p>
          <p className='text-xs text-gray-500'>Total Appointments</p>
        </div>
        <div className='p-4 bg-white border border-gray-200 rounded-xl'>
          <p className='text-xl font-semibold text-gray-800'>{self}</p>
          <p className='text-xs text-gray-500'>Booked for Self</p>
        </div>
        <div className='p-4 bg-white border border-gray-200 rounded-xl'>
          <p className='text-xl font-semibold text-gray-800'>{other}</p>
          <p className='text-xs text-gray-500'>Booked for Other</p>
        </div>
      </div>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width='100%' height='100%'>
          <PieChart>
            <Pie data={data} dataKey='value' nameKey='name' cx='50%' cy='50%' innerRadius={55} outerRadius={85} paddingAngle={3} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
              {data.map((entry, index) => <Cell key={entry.name} fill={colors[index]} stroke='none' />)}
            </Pie>
            <Tooltip />
            <Legend verticalAlign='bottom' height={36} iconType='circle' iconSize={8} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default DoctorBookingType
