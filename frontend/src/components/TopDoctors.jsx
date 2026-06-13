import React, { useContext, useEffect, useState } from 'react'
// import { doctors } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const getDoctorCount = () => {
  const w = window.innerWidth
  if (w >= 1920) return 12  // 27"+ displays
  if (w >= 1024) return 10  // 13"-24" laptops & monitors
  if (w >= 640) return 8    // tablets
  return 6                   // mobile
}

const TopDoctors = () => {

  const navigate = useNavigate()
  const {doctors} = useContext(AppContext)
  const [doctorCount, setDoctorCount] = useState(getDoctorCount)

  useEffect(() => {
    const handleResize = () => setDoctorCount(getDoctorCount())
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className='flex flex-col items-center gap-4 my-16 text-gray-900 md:mx-10'>
      <h1 className='text-3xl font-medium'>Top Doctors to Book</h1>
      <p className='text-sm text-center sm:w-1/3'>Simply browse through our extensive list of trusted doctors</p>
      <div className='grid w-full gap-4 px-3 pt-5 grid-cols-auto gap-y-6 sm:px-0'
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {doctors.slice(0,doctorCount).map((item,index)=>(
            <div onClick={()=>{navigate(`/appointment/${item._id}`); scrollTo(0,0)}} className='flex flex-col items-center gap-2 p-5 text-center transition-all duration-300 bg-white border border-gray-200 cursor-pointer rounded-2xl hover:-translate-y-1 hover:shadow-lg' key={index}>
                <img src={`http://localhost:4000${item.image}`} alt={item.name} className='object-cover w-24 h-24 rounded-full ring-4 ring-blue-50 bg-blue-50' />
                {item.gender && (
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.gender.toLowerCase() === 'female' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'}`}>
                    {item.gender}
                  </span>
                )}
                <p className='font-semibold text-gray-900'>{item.name}</p>
                <p className='text-sm text-gray-500'>{item.speciality}</p>
                <span className={`flex items-center gap-1 text-xs font-medium ${item.available ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${item.available ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  {item.available ? 'Available' : 'Unavailable'}
                </span>
                <span className='px-3 py-1 mt-1 text-xs font-medium rounded-full bg-primary/10 text-primary'>Book Appointment</span>
            </div>
        ))}
      </div>
      <button onClick={()=>{navigate('doctors'); scrollTo(0,0)}} className='px-12 py-3 mt-10 text-gray-600 rounded-full bg-blue-50'>more</button>
    </div>
  )
}

export default TopDoctors
