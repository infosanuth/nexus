import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const SpecialityReport = () => {

  const { aToken, specialityReport, getSpecialityReport } = useContext(AdminContext)

  useEffect(() => {
    if (aToken) {
      getSpecialityReport()
    }
  }, [aToken,])

  const specialityNames = [...new Set(specialityReport.map((item) => item.specialityName?.trim()).filter(Boolean))].sort()


  return (
    <div className='w-full max-w-4xl m-5'>

      <p className='mb-3 text-lg font-medium'>Speciality Report</p>
      <div className='max-sm:hidden grid grid-cols-[0.4fr_1fr_1fr] gap-1 py-3 px-6 border-b bg-gray-50 text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>
        <p>#</p>
        <p>Speciality</p>
        <p>Number of Appointment</p>
      </div>

      {/* specialityReport.map(item,key) => ()  */}
      {/* key={item.specialityId} */}
      <p className='font-medium text-gray-800'>{item.specialityName}</p>
      <p className='text-center'>{item.doctorCount}</p>
    </div>


  )
}

export default SpecialityReport
