import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { AdminContext } from '../context/AdminContext'
import { DoctorContext } from '../context/DoctorContext'
import { useNavigate } from 'react-router-dom'
import { ReceptionContext } from '../context/ReceptionContext'

const Navbar = () => {

  const { aToken, setAToken, setAName } = useContext(AdminContext)
  const { dToken, setDToken } = useContext(DoctorContext)
  const { rToken, setRToken, setRName } = useContext(ReceptionContext)

  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const navigate = useNavigate()

  const confirmLogout = () => {
    navigate('/')
    dToken && setDToken('')
    dToken && localStorage.removeItem('dToken')
    aToken && setAToken('')
    aToken && setAName('')
    aToken && localStorage.removeItem('aToken')
    aToken && localStorage.removeItem('aName')
    rToken && setRToken('')
    rToken && setRName('')
    rToken && localStorage.removeItem('rToken')
    rToken && localStorage.removeItem('rName')
    setShowLogoutDialog(false)
  }

  return (
    <div className='flex items-center justify-between px-4 py-3 bg-white border-b sm:px-10'>
      <div className='flex items-center gap-2 text-xs'>
        <img className='cursor-pointer w-36 h-11 sm:w-40' src={assets.admin_logo} alt="" /> {/* h-11 */}
        <p className='border px-2.5 py-0.5 rounded-full border-gray-500 text-gray-600 mt-4'>{aToken ? 'Admin' : rToken ? 'Reception' : 'Doctor'}</p> {/* mt-4*/}
      </div>
      <button onClick={() => setShowLogoutDialog(true)} className='px-10 py-2 text-sm text-white rounded-full bg-primary'>Logout</button>

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[300px]">
            <h2 className="mb-4 text-lg font-semibold">Are you sure you want to logout?</h2>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="px-4 py-2 text-gray-800 bg-gray-300 rounded hover:bg-gray-400"
              >
                No
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Navbar
