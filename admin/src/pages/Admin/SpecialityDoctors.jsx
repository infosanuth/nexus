import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Search, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'

const SpecialityDoctors = () => {

  const { specialityName } = useParams()
  const navigate = useNavigate()
  const { aToken, doctors, getAllDoctors } = useContext(AdminContext)
  const { currency } = useContext(AppContext)
  const [search, setSearch] = useState('')

  const decodedSpeciality = decodeURIComponent(specialityName || '')

  useEffect(() => {
    if (aToken) getAllDoctors()
  }, [aToken])

  const specialityDoctors = useMemo(() => {
    return doctors.filter((doc) => doc.speciality === decodedSpeciality)
  }, [doctors, decodedSpeciality])

  const filteredDoctors = specialityDoctors.filter((item) => {
    const term = search.trim().toLowerCase()
    return !term || item.name?.toLowerCase().includes(term)
  })

  const handleExport = () => {
    const header = ['Doctor', 'Fee']
    const rows = filteredDoctors.map((item) => [item.name, item.fees])

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
    ws['!cols'] = [
      { wch: 24 }, // Doctor
      { wch: 12 }, // Fee
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Speciality Doctors')
    XLSX.writeFile(wb, `${decodedSpeciality}-doctors-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className='w-full max-w-3xl m-5'>

      <div className='flex flex-wrap items-center gap-3 mb-4'>
        <button
          onClick={() => navigate(-1)}
          className='flex items-center justify-center text-gray-500 transition-colors bg-white border rounded-lg shadow-sm w-9 h-9 hover:border-gray-300 hover:text-gray-800'
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className='text-lg font-semibold text-gray-800'>{decodedSpeciality}</p>
          <p className='text-xs text-gray-400'>{specialityDoctors.length} doctor{specialityDoctors.length === 1 ? '' : 's'}</p>
        </div>

        <div className='relative w-64 ml-auto'>
          <Search size={14} className='absolute text-gray-400 -translate-y-1/2 left-3 top-1/2' />
          <input
            type='text'
            placeholder='Search by doctor name'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full py-1.5 pl-8 pr-8 text-sm bg-white border rounded-lg shadow-sm focus:outline-none focus:border-primary'
          />
          {search && (
            <button onClick={() => setSearch('')} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500'>
              <X size={13} />
            </button>
          )}
        </div>

        <button
          onClick={handleExport}
          className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors bg-white border rounded-lg shadow-sm hover:border-gray-300 hover:text-gray-800'
        >
          <Download size={14} /> Export
        </button>
      </div>

      <div className='overflow-hidden bg-white border shadow-sm rounded-xl text-sm'>
        <div className='max-sm:hidden grid grid-cols-[0.4fr_2fr_1fr] gap-1 py-3 px-6 bg-gray-50 border-b text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>
          <p>#</p>
          <p>Doctor</p>
          <p className='text-right'>Fee</p>
        </div>

        <div className='max-h-[65vh] overflow-y-auto'>
          {filteredDoctors.length === 0
            ? <p className='p-6 text-gray-500'>{search ? 'No matching doctors' : 'No doctors in this speciality'}</p>
            : filteredDoctors.map((item, index) => (
              <div
                className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.4fr_2fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b last:border-0'
                key={item._id}
              >
                <p className='max-sm:hidden'>{index + 1}</p>
                <p className='font-medium text-gray-800'>{item.name}</p>
                <p className='font-semibold text-right text-gray-800'>{currency}{item.fees?.toLocaleString()}</p>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

export default SpecialityDoctors
