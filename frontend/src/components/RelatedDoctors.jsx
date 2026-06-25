import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'

const RelatedDoctors = ({ docId, speciality }) => {

  const { doctors, backendUrl } = useContext(AppContext)
  const navigate = useNavigate()

  const [relDoc, setRelDocs] = useState([])

  useEffect(() => {
    if (doctors.length > 0 && speciality) {
      const doctorsData = doctors.filter((doc) => doc.speciality === speciality && doc._id !== docId)
      setRelDocs(doctorsData)
    }
    console.log("Doctors in RelatedDoctors:", doctors)
  }, [doctors, speciality, docId])

  return (
    <div className='flex flex-col items-center gap-4 my-16 text-gray-900 md:mx-10'>
      <h1 className='text-3xl font-medium'>Related Doctors</h1>
      <p className='sm:w-1/3 text-center text-sm'>Simply browse through our extensive list of trusted doctors</p>
      <div className='w-full grid grid-cols-auto gap-4 pt-5 gap-y-6 px-3 sm:px-0'
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {relDoc.slice(0, 5).map((item, index) => (
          <div onClick={() => { navigate(`/appointment/${item._id}`); scrollTo(0, 0) }} className='flex flex-col items-center justify-center gap-2 p-5 text-center transition-all duration-300 bg-white border border-gray-200 cursor-pointer rounded-2xl min-h-[260px] hover:-translate-y-1 hover:shadow-lg' key={index}>
            <img src={item.image ? `${backendUrl}${item.image}` : assets.default_doctor_pastel} alt={item.name} className='object-cover w-24 h-24 rounded-full ring-4 ring-blue-50 bg-blue-50' />
            {item.gender && (
              <p className={`text-xs font-medium ${item.gender.toLowerCase() === 'female' ? 'text-pink-600' : 'text-blue-600'}`}>
                {item.gender}
              </p>
            )}
            <p className='mt-6 font-semibold text-gray-900'>{item.name}</p>
            <p className='text-sm text-gray-500'>{item.speciality}</p>
          </div>
        ))}
      </div>
      {/* <button onClick={()=>{navigate('doctors'); scrollTo(0,0)}} className='bg-blue-50 text-gray-600 px-12 py-3 rounded-full mt-10'>more</button> */}
    </div>
  )
}

export default RelatedDoctors
