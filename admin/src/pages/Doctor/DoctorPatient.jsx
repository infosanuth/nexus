import React from 'react'
import { useEffect, useMemo, useContext, useState } from 'react'
import { Search, X } from 'lucide-react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'

const DoctorPatient = () => {

  const { dToken, appointments, getAppointments } = useContext(DoctorContext)
  const { calculateAge } = useContext(AppContext)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (dToken) {
      getAppointments()
    }
  }, [dToken])

  const patients = useMemo(() => {
    const map = new Map()

    appointments.filter((item) => item.payment).forEach((item) => {
      const key = item.userData.phoneNumber || item.userData.phone || item.userId

      map.set(key, {
        name: item.userData.name,
        phone: item.userData.phoneNumber || item.userData.phone || '-',
        age: item.userData.age || calculateAge(item.userData.dob),
        gender: item.userData.gender || 'Not Selected',
        method: item.isWalkIn ? 'Walk-in' : 'Online',
        count: (map.get(key)?.count || 0) + 1
      })
    })

    return Array.from(map.values())
  }, [appointments])

  const filteredPatients = patients.filter((item) => {
    const term = search.trim().toLowerCase()
    if (!term) return true
    return item.name?.toLowerCase().includes(term) || item.phone?.toLowerCase().includes(term)
  })

  return (
    <div className='w-full max-w-6xl m-5'>

      <p className='mb-3 text-lg font-medium'>All Patients</p>

      <div className='flex items-center px-5 py-3 mb-3 bg-white border rounded-xl'>
        <div className='relative w-64 ml-auto'>
          <Search size={14} className='absolute text-gray-400 -translate-y-1/2 left-3 top-1/2' />
          <input
            type='text'
            placeholder='Search by name or phone number'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full py-1.5 pl-8 pr-8 text-sm border rounded-lg focus:outline-none focus:border-primary'
          />
          {search && (
            <button onClick={() => setSearch('')} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500'>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.4fr_1.6fr_1.2fr_0.6fr_0.9fr_1fr_1fr] gap-1 py-3 px-6 border-b'>
          <p>#</p>
          <p>Patient</p>
          <p>Phone Number</p>
          <p>Age</p>
          <p>Gender</p>
          <p>Method</p>
          <p>Appointments</p>
        </div>

        {filteredPatients.map((item, index) => (
            //  {patients.map((item, index) => (
          <div className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.4fr_1.6fr_1.2fr_0.6fr_0.9fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
            <p className='max-sm:hidden'>{index + 1}</p>
            <p>{item.name}</p>
            <p>{item.phone}</p>
            <p className='max-sm:hidden'>{item.age}</p>
            <p>{item.gender}</p>
            <div>
              <p className='inline px-2 text-xs border rounded-full border-primary'>
                {item.method}
              </p>
            </div>
            <p>{item.count}</p>
          </div>
        ))
        }
      </div>
    </div>
  )
}

export default DoctorPatient
