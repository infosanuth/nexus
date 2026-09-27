import React, { useContext } from 'react'
import { AdminContext } from '../context/AdminContext'
import { useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { DoctorContext } from '../context/DoctorContext'
import { ReceptionContext } from '../context/ReceptionContext'
import { Settings, Stethoscope, UserRoundPen, CalendarPlus, CalendarDays, UserCheck, ClipboardList, RotateCcw, History, LayoutDashboard, ListCheck, Users, ArrowRightLeft, Banknote, BarChart3, ChartLine, UserX, Wallet, Table2, PieChart, TrendingUp } from 'lucide-react';

// Doctor sidebar pages, grouped under headings.
// To hide a page from the doctor sidebar, just comment out its line below.
const DOCTOR_OVERVIEW_LINKS = [
  { to: '/doctor-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
]

const DOCTOR_MANAGE_LINKS = [
  { to: '/doctor-appointments', icon: ListCheck, label: 'Appointments' },
  { to: '/doctor-patients', icon: UserCheck, label: 'Patients' },
  // { to: '/doctor-patient-history', icon: ClipboardList, label: 'Patient History' },
  // { to: '/doctor-rescheduled-appointments', icon: ArrowRightLeft, label: 'Rescheduled' },
  // { to: '/doctor-no-shows', icon: UserX, label: 'No-Shows' },
]

const DOCTOR_REPORT_LINKS = [
  // { to: '/doctor-online-vs-offline', icon: ChartLine, label: 'Online vs Walk-In' },
  // { to: '/doctor-male-vs-female', icon: ChartLine, label: 'Male vs Female' },
  // { to: '/doctor-booking-type', icon: ChartLine, label: 'Booking Type' },
  { to: '/doctor-monthly-summary', icon: Table2, label: 'Monthly Summary' },
]

const DOCTOR_SESSION_LINKS = [
  { to: '/doctor-add-session', icon: CalendarPlus, label: 'Add Session' },
  { to: '/doctor-sessions', icon: CalendarDays, label: 'Session Schedule' },
  { to: '/doctor-session-history', icon: History, label: 'Session History' },
]

const DOCTOR_OTHER_LINKS = [
  { to: '/doctor-profile', image: assets.people_icon, label: 'Profile' },
]

// Reception sidebar pages, grouped under headings.
// To hide a page from the reception sidebar, just comment out its line below.
const RECEPTION_OVERVIEW_LINKS = [
  { to: '/reception-patient-check-in', icon: UserCheck, label: 'Patient Check-In' },
]

const RECEPTION_MANAGE_LINKS = [
  { to: '/reception-doctors', icon: Stethoscope, label: 'Find Doctors' },
  { to: '/reception-all-appointments', icon: ClipboardList, label: 'All Appointments' },
  { to: '/reception-patients', icon: Users, label: 'Patients' },
  { to: '/reception-patient-history', icon: ClipboardList, label: 'Patient History' },
  { to: '/reception-rescheduled-appointments', icon: ArrowRightLeft, label: 'Rescheduled' },
  { to: '/reception-no-shows', icon: UserX, label: 'No-Shows' },
]

const RECEPTION_SESSION_LINKS = [
  { to: '/reception-sessions', icon: CalendarDays, label: 'Session Schedule' },
  { to: '/reception-session-history', icon: History, label: 'Session History' },
  { to: '/reception-add-sessions', icon: CalendarPlus, label: 'Add Sessions' },
]

const RECEPTION_REFUND_LINKS = [
  { to: '/reception-all-refunds', icon: Wallet, label: 'All Refunds' },
  { to: '/reception-refunds', icon: RotateCcw, label: 'Online Refunds' },
  { to: '/reception-cash-refunds', icon: Banknote, label: 'Cash Refunds' },
]

// Admin sidebar pages, grouped under headings.
// To hide a page from the admin sidebar, just comment out its line below.
const ADMIN_OVERVIEW_LINKS = [
  { to: '/admin-dashboard', image: assets.home_icon, label: 'Dashboard' },
]

const ADMIN_MANAGE_LINKS = [
  { to: '/all-appointments', image: assets.appointment_icon, label: 'Appointments' },
  { to: '/all-patients', icon: Users, label: 'Patients' },
  { to: '/admin-patient-history', icon: ClipboardList, label: 'Patient History' },
  { to: '/admin-rescheduled-appointments', icon: ArrowRightLeft, label: 'Rescheduled' },
  { to: '/admin-no-shows', icon: UserX, label: 'No-Shows' },
  { to: '/admin-all-refunds', icon: Wallet, label: 'All Refunds' },
]

const ADMIN_TEAM_LINKS = [
  { to: '/add-doctor', image: assets.add_icon, label: 'Add Doctor' },
  { to: '/doctor-list', image: assets.people_icon, label: 'Doctor List' },
  // { to: '/doctor-details', icon: Table2, label: 'Doctor Details' },
  // { to: '/doctor-registry', icon: Table2, label: 'Doctor Registry' },
  { to: '/specialities', icon: Settings, label: 'Specialities' },
  { to: '/staff', icon: UserRoundPen, label: 'staff' },
]

const ADMIN_REPORT_LINKS = [
  { to: '/speciality-data', icon: BarChart3, label: 'Speciality Data' },
  { to: '/admin-speciality-report', icon: PieChart, label: 'Speciality Report' },
  { to: '/admin-doctor-performance', icon: TrendingUp, label: 'Doctor Performance' },
  { to: '/admin-session-report', icon: Table2, label: 'Session Report' },
  // { to: '/admin-appointment-report', icon: Table2, label: 'Appointment Report' },
  // { to: '/admin-cancel-rate-report', icon: Table2, label: 'Cancel Rate Report' },
  // { to: '/admin-complete-rate-report', icon: Table2, label: 'Complete Rate Report' },
  // { to: '/admin-online-vs-walkin', icon: Table2, label: 'Online vs Walk-in' },
  // { to: '/admin-male-vs-female', icon: Table2, label: 'Male vs Female' },
  // { to: '/admin-booking-type', icon: Table2, label: 'Booking Type' },
]

const ADMIN_SESSION_LINKS = [
  { to: '/admin-sessions', icon: CalendarDays, label: 'Session Schedule' },
  { to: '/admin-session-history', icon: History, label: 'Session History' },
]

// Renders one sidebar link — used by SidebarSection below
const SidebarLink = ({ to, icon: Icon, image, label, badge }) => (
  <NavLink className={({ isActive }) => `flex items-center gap-3 py-3.5 px-3 md:px-9 md:min-w-72 cursor-pointer ${isActive ? 'bg-[#F2F3FF] border-r-4 border-[#64748B]' : ''}`} to={to}>
    {Icon ? <Icon /> : <img src={image} alt="" />}
    <p className='hidden font-semibold md:block'>{label}</p>
    {badge}
  </NavLink>
)

// Renders a heading followed by its links — used to group the sidebar.
// `badges` optionally maps a link's `to` path to an extra node (e.g. a count pill) rendered after its label.
const SidebarSection = ({ title, links, badges }) => (
  <>
    <p className='hidden md:block px-9 pt-4 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>{title}</p>
    {links.map((link) => <SidebarLink key={link.to} {...link} badge={badges?.[link.to]} />)}
  </>
)

const Sidebar = () => {

  const { aToken, aName } = useContext(AdminContext)
  const { dToken, profileData, getProfileData, backendUrl } = useContext(DoctorContext)
  const { rToken, rName } = useContext(ReceptionContext)
  const { getDashData, dashData } = useContext(AdminContext)
  const navigate = useNavigate()

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

  const displayName = dToken ? (profileData.name || 'Doctor') : aToken ? (aName || 'Admin') : rToken ? (rName || 'Receptionist') : ''
  const roleLabel = dToken ? 'Doctor' : aToken ? 'Admin' : rToken ? 'Reception' : ''
  const profilePath = dToken ? '/doctor-profile' : aToken ? '/admin-profile' : rToken ? '/reception-profile' : ''

  return (
    <div className='flex flex-col justify-between h-full bg-white border-r'>
      <div className='overflow-y-auto'>
      {
        aToken && <ul className='text-[#515151] mt-2'>
          <SidebarSection title='Overview' links={ADMIN_OVERVIEW_LINKS} />
          <SidebarSection title='Manage' links={ADMIN_MANAGE_LINKS} />
          <SidebarSection title='Team' links={ADMIN_TEAM_LINKS} badges={{ '/doctor-list': <button className='w-6 h-4 gap-2 text-xs text-black border rounded-xl bg-slate-100'>{dashData.doctors}</button> }} />
          <SidebarSection title='Reports' links={ADMIN_REPORT_LINKS} />
          <SidebarSection title='Sessions' links={ADMIN_SESSION_LINKS} />
        </ul>
      }

      {
        dToken && <ul className='text-[#515151] mt-2'>
          <SidebarSection title='Overview' links={DOCTOR_OVERVIEW_LINKS} />
          <SidebarSection title='Manage' links={DOCTOR_MANAGE_LINKS} />
          <SidebarSection title='Reports' links={DOCTOR_REPORT_LINKS} />
          <SidebarSection title='Sessions' links={DOCTOR_SESSION_LINKS} />
          <SidebarSection title='Other' links={DOCTOR_OTHER_LINKS} />
        </ul>
      }

      {
        rToken && <ul className='text-[#515151] mt-2'>
          <SidebarSection title='Overview' links={RECEPTION_OVERVIEW_LINKS} />
          <SidebarSection title='Manage' links={RECEPTION_MANAGE_LINKS} />
          <SidebarSection title='Sessions' links={RECEPTION_SESSION_LINKS} />
          <SidebarSection title='Refunds' links={RECEPTION_REFUND_LINKS} />
        </ul>
      }
      </div>

      {(aToken || dToken || rToken) && (
        <button
          onClick={() => profilePath && navigate(profilePath)}
          // className='flex items-center w-full gap-3 p-4 text-left transition-colors border-t hover:bg-gray-50'
          className='flex items-center w-full gap-3 p-4 text-left transition-colors border-t'
        >
          {dToken && profileData.image
            ? <img src={`${backendUrl}${profileData.image}`} alt="" className='object-cover rounded-full w-9 h-9' />
            : <div className='flex items-center justify-center text-sm font-semibold text-white rounded-full w-9 h-9 bg-primary'>{displayName.charAt(0).toUpperCase()}</div>
          }
          <div className='hidden md:block'>
            <p className='text-sm font-medium text-gray-700'>{displayName}</p>
            <p className='text-xs text-gray-400'>{roleLabel}</p>
          </div>
        </button>
      )}
    </div>
  )
}

export default Sidebar
