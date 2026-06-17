import React, { useContext } from 'react'
import { AdminContext } from '../context/AdminContext'
import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'
import { DoctorContext } from '../context/DoctorContext'
import { ReceptionContext } from '../context/ReceptionContext'
import { MessageSquareText, Calendar, Settings, Stethoscope, UserRoundPen, CalendarPlus, CalendarDays, UserCheck, ClipboardList } from 'lucide-react';


const Sidebar = () => {

  const { aToken } = useContext(AdminContext)
  const { dToken } = useContext(DoctorContext)
  const { rToken } = useContext(ReceptionContext)
  const { getDashData, dashData } = useContext(AdminContext)

  useEffect(() => {
    if (aToken) {
      getDashData()
    }
  }, [aToken])

  return (
    <div className='min-h-screen bg-white border-r'>
      {
        aToken && <ul className='text-[#515151] mt-5'>
          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/admin-dashboard'}>
            <img src={assets.home_icon} alt="" />
            <p className='hidden md:block'>Dashboard</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/all-appointments'}>
            <img src={assets.appointment_icon} alt="" />
            <p className='hidden md:block'>Appointments</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/add-doctor'}>
            <img src={assets.add_icon} alt="" />
            <p className='hidden md:block'>Add Doctor</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/doctor-list'}>
            <img src={assets.people_icon} alt="" />
            <p className='hidden md:block'>Doctor List</p>
            <button className='w-6 h-4 gap-2 text-xs text-black border rounded-xl bg-slate-100'>{dashData.doctors}</button>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/specialities'}>
            <Settings />
            <p className='hidden md:block'>Specialities</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/staff'}>
            <UserRoundPen />
            <p className='hidden md:block'>staff</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/messages'}>
            <MessageSquareText />
            <p className='hidden md:block'>Messages</p>
            <button className='w-6 h-4 gap-2 text-xs text-white bg-red-600 border border-red-600 rounded-xl'> 12</button>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/calendar'}>
            <Calendar />
            <p className='hidden md:block'>Calendar</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/settings'}>
            <Settings />
            <p className='hidden md:block'>Settings</p>
          </NavLink>

        </ul>
      }

      {
        dToken && <ul className='text-[#515151] mt-5'>
          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/doctor-dashboard'}>
            <img src={assets.home_icon} alt="" />
            <p className='hidden md:block'>Dashboard</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/doctor-appointments'}>
            <img src={assets.appointment_icon} alt="" />
            <p className='hidden md:block'>Appointments</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/doctor-add-session'}>
            <CalendarPlus />
            <p className='hidden md:block'>Add Session</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/doctor-sessions'}>
            <CalendarDays />
            <p className='hidden md:block'>My Sessions</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/doctor-profile'}>
            <img src={assets.people_icon} alt="" />
            <p className='hidden md:block'>Profile</p>
          </NavLink>
        </ul>
      }

      {
        rToken && <ul className='text-[#515151] mt-5'>
          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/reception-patient-check-in'}>
            <UserCheck />
            <p className='hidden md:block'>Patient Check-In</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/reception-all-appointments'}>
            <ClipboardList />
            <p className='hidden md:block'>All Appointments</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/reception-sessions'}>
            <CalendarDays />
            <p className='hidden md:block'>Sessions</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/reception-add-sessions'}>
            <CalendarPlus />
            <p className='hidden md:block'>Add Sessions</p>
          </NavLink>
        </ul>
      }
    </div>
  )
}

export default Sidebar
