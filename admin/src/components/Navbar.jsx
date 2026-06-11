import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { AdminContext } from '../context/AdminContext'
import { DoctorContext } from '../context/DoctorContext'
import { useNavigate } from 'react-router-dom'
import { ReceptionContext } from '../context/ReceptionContext'

const Navbar = () => {

  const { aToken, setAToken } = useContext(AdminContext)
  const { dToken, setDToken } = useContext(DoctorContext)
  const { rToken, setRToken } = useContext(ReceptionContext)


  const navigate = useNavigate()

  const logout = () => {
    navigate('/')
    dToken && setDToken('')
    dToken && localStorage.removeItem('dToken')
    aToken && setAToken('')
    aToken && localStorage.removeItem('aToken')
    rToken && setRToken('')
    rToken && localStorage.removeItem('rToken')
  }

  return (
    <div className='flex items-center justify-between px-4 py-3 bg-white border-b sm:px-10'>
      <div className='flex items-center gap-2 text-xs'>
        <img className='cursor-pointer w-36 h-11 sm:w-40' src={assets.admin_logo} alt="" /> {/* h-11 */}
        <p className='border px-2.5 py-0.5 rounded-full border-gray-500 text-gray-600 mt-4'>{aToken ? 'Admin' : rToken ? 'Reception' : 'Doctor'}</p> {/* mt-4*/}
      </div>
      <button onClick={() => logout()} className='px-10 py-2 text-sm text-white rounded-full bg-primary'>Logout</button>
    </div>
  )
}

export default Navbar
