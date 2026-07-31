import React, { useContext, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DoctorContext } from '../../context/DoctorContext'

const colors = ['blue', 'green']

const DoctorBookingType = () => {
  const { dToken, appointments, getAppointments } = useContext(DoctorContext)

  useEffect(() => { if (dToken) getAppointments() }, [dToken])

  const data = useMemo(() => {
    const paid = appointments.filter((item) => item.payment && !item.isWalkIn)
    const self = paid.filter((item) => item.bookedForSelf).length
    const other = paid.length - self
    return [{ name: 'Self', value: self }, { name: 'Other', value: other }]
  }, [appointments])

  const [self, other] = data.map((item) => item.value)
  const total = self + other

  return (
    <div className='w-full max-w-6xl m-5'>
      <p className='mb-4 text-lg font-medium'>Booking Type</p>

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
