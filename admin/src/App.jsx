import React, { useContext } from 'react'
import Login from './pages/Login'
import { ToastContainer, } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AdminContext } from './context/AdminContext'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import { Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Admin/Dashboard'
import AllApointments from './pages/Admin/AllApointments'
import AddDoctor from './pages/Admin/AddDoctor'
import DoctorsList from './pages/Admin/DoctorsList'
import { DoctorContext } from './context/DoctorContext'
import DoctorAppointments from './pages/Doctor/DoctorAppointments';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorProfile from './pages/Doctor/DoctorProfile';
import DoctorAddSession from './pages/Doctor/DoctorAddSession';
import DoctorGetSession from './pages/Doctor/DoctorGetSession';
import DocAppointment from './pages/Admin/DocAppointment'
import Specialities from './pages/Admin/Specialities'
import Staff from './pages/Admin/Staff'
import { ReceptionContext } from './context/ReceptionContext'



const App = () => {

  const { aToken } = useContext(AdminContext)
  const { dToken } = useContext(DoctorContext)
  const { rToken } = useContext(ReceptionContext)

  return dToken || aToken || rToken ? (
    <div className='bg-[#F8F9FD]'>
      <ToastContainer />
      <Navbar />
      <div className='flex items-start'>
        <Sidebar />
        <Routes>
          <Route path='/' element={<Navigate to={aToken ? '/admin-dashboard' : dToken ? '/doctor-dashboard' : '/admin-dashboard'} replace />} />
          {/* Admin Route */}
          <Route path='/admin-dashboard' element={<Dashboard />} />
          <Route path='/all-appointments' element={<AllApointments />} />
          <Route path='/add-doctor' element={<AddDoctor />} />
          <Route path='/doctor-list' element={<DoctorsList />} />
          <Route path='/specialities' element={<Specialities />} />
          <Route path='/staff' element={<Staff />} />
          {/* Doctor Route */}
          <Route path='/doctor-dashboard' element={<DoctorDashboard />} />
          <Route path='/doctor-appointments' element={<DoctorAppointments />} />
          <Route path='/doctor-profile' element={<DoctorProfile />} />
          <Route path='/doctor-add-session' element={<DoctorAddSession />} />
          <Route path='/doctor-sessions' element={<DoctorGetSession />} />
          <Route path='/appointments/:doctorId' element={<DocAppointment/>} />
        </Routes>
      </div>
    </div>
  ) : (
    <>
      <Login />
      <ToastContainer />
    </>
  )
}

export default App
