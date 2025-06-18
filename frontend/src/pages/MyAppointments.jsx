import React from 'react'

const MyAppointments = () => {
  return (
    <div>
      <p className='pb-3 mt-12 font-medium text-zinc-700 border-b'>My appointmets</p>
      <div className='flex flex-col gap-2 justify-end'>
        <button className=' text-sm text-stone-500 text-center sm:min-w-48 py-2 border hover:bg-[#64748B] hover:text-white transition-all duration-300'>Pay Online</button>
        <button className=' text-sm text-stone-500 text-center sm:min-w-48 py-2 border hover:bg-red-500 hover:text-white transition-all duration-300'>Cancel appointment</button>
      </div>
    </div>
  )
}

export default MyAppointments

