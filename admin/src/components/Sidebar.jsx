import React, { useContext } from 'react'
import { AdminContext } from '../context/AdminContext'
import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { assets } from '../assets/assets'
import { DoctorContext } from '../context/DoctorContext'
import { ReceptionContext } from '../context/ReceptionContext'
import { Settings, Stethoscope, UserRoundPen, CalendarPlus, CalendarDays, UserCheck, ClipboardList, RotateCcw, History, LayoutDashboard, ListCheck, Users, ArrowRightLeft, Banknote, BarChart3 } from 'lucide-react';


const Sidebar = () => {

  const { aToken } = useContext(AdminContext)
  const { dToken, profileData, getProfileData, backendUrl } = useContext(DoctorContext)
  const { rToken } = useContext(ReceptionContext)
  const { getDashData, dashData } = useContext(AdminContext)

  useEffect(() => {
    if (aToken) {
      getDashData()
    }
  }, [aToken])

  useEffect(() => {
    if (dToken) {
      getProfileData()
    }
  }, [dToken])

  const displayName = dToken ? (profileData.name || 'Doctor') : aToken ? 'Admin' : rToken ? 'Receptionist' : ''
  const roleLabel = dToken ? 'Doctor' : aToken ? 'Admin' : rToken ? 'Reception' : ''

  return (
    <div className='flex flex-col justify-between h-full bg-white border-r'>
      <div className='overflow-y-auto'>
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

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/all-patients'}>
            <Users />
            <p className='hidden md:block'>Patients</p>
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

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/speciality-report'}>
            <BarChart3 />
            <p className='hidden md:block'>Speciality Report</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/staff'}>
            <UserRoundPen />
            <p className='hidden md:block'>staff</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/admin-sessions'}>
            <CalendarDays />
            <p className='hidden md:block'>Session Schedule</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/admin-session-history'}>
            <History />
            <p className='hidden md:block'>Session History</p>
          </NavLink>

        </ul>
      }

      {
        dToken && <ul className='text-[#515151] mt-5'>
          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/doctor-dashboard'}>
            <LayoutDashboard />
            <p className='hidden md:block'>Dashboard</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/doctor-appointments'}>
            <ListCheck />
            <p className='hidden md:block'>Appointments</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/doctor-patients'}>
            <UserCheck />
            <p className='hidden md:block'>Patients</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/doctor-add-session'}>
            <CalendarPlus />
            <p className='hidden md:block'>Add Session</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/doctor-sessions'}>
            <CalendarDays />
            <p className='hidden md:block'>Session Schedule</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/doctor-session-history'}>
            <History />
            <p className='hidden md:block'>Session History</p>
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

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/reception-doctors'}>
            <Stethoscope />
            <p className='hidden md:block'>Find Doctors</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/reception-all-appointments'}>
            <ClipboardList />
            <p className='hidden md:block'>All Appointments</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/reception-patients'}>
            <Users />
            <p className='hidden md:block'>Patients</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/reception-sessions'}>
            <CalendarDays />
            <p className='hidden md:block'>Session Schedule</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/reception-session-history'}>
            <History />
            <p className='hidden md:block'>Session History</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/reception-add-sessions'}>
            <CalendarPlus />
            <p className='hidden md:block'>Add Sessions</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/reception-refunds'}>
            <RotateCcw />
            <p className='hidden md:block'>Online Refunds</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/reception-cash-refunds'}>
            <Banknote />
            <p className='hidden md:block'>Cash Refunds</p>
          </NavLink>

          <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={'/reception-rescheduled-appointments'}>
            <ArrowRightLeft />
            <p className='hidden md:block'>Rescheduled</p>
          </NavLink>
        </ul>
      }
      </div>

      {(aToken || dToken || rToken) && (
        <div className='flex items-center gap-3 p-4 border-t'>
          {dToken && profileData.image
            ? <img src={`${backendUrl}${profileData.image}`} alt="" className='object-cover rounded-full w-9 h-9' />
            : <div className='flex items-center justify-center text-sm font-semibold text-white rounded-full w-9 h-9 bg-primary'>{displayName.charAt(0).toUpperCase()}</div>
          }
          <div className='hidden md:block'>
            <p className='text-sm font-medium text-gray-700'>{displayName}</p>
            <p className='text-xs text-gray-400'>{roleLabel}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sidebar
