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
import Patients from './pages/Admin/Patients'
import AddDoctor from './pages/Admin/AddDoctor'
import DoctorsList from './pages/Admin/DoctorsList'
import EditDoctorProfile from './pages/Admin/EditDoctorProfile'
import { DoctorContext } from './context/DoctorContext'
import DoctorAppointments from './pages/Doctor/DoctorAppointments';
import DoctorPatient from './pages/Doctor/DoctorPatient';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorProfile from './pages/Doctor/DoctorProfile';
import DoctorAddSession from './pages/Doctor/DoctorAddSession';
import DoctorSessionSchedule from './pages/Doctor/DoctorSessionSchedule';
import Specialities from './pages/Admin/Specialities'
import SpecialityReport from './pages/Admin/SpecialityReport'
import Staff from './pages/Admin/Staff'
import SessionSchedule from './pages/Admin/SessionSchedule'
import SessionHistory from './pages/Admin/SessionHistory'
import { ReceptionContext } from './context/ReceptionContext'
import PatientCheckIn from './pages/Reception/PatientCheckIn'
import DoctorsForReception from './pages/Reception/DoctorsForReception'
import AllAppointmentForReception from './pages/Reception/AllAppointmentForReception'
import PatientsForReception from './pages/Reception/PatientsForReception'
import ReceptionSessions from './pages/Reception/SessionsForReception'
import ReceptionSessionHistory from './pages/Reception/SessionHistoryForReception'
import AddSessions from './pages/Reception/AddSessionsForReception'
import RefundsForReception from './pages/Reception/RefundsForReception'
import CashRefundsForReception from './pages/Reception/CashRefundsForReception'
import RescheduledAppointmentsForReception from './pages/Reception/RescheduledAppointmentsForReception'
import DoctorSessionHistory from './pages/Doctor/DoctorSessionHistory'
import DoctorSessionAppointments from './pages/Doctor/DoctorSessionAppointments'
import DoctorSessionAppointmentsHistory from './pages/Doctor/DoctorSessionAppointmentsHistory'


const App = () => {

  const { aToken } = useContext(AdminContext)
  const { dToken } = useContext(DoctorContext)
  const { rToken } = useContext(ReceptionContext)

  return dToken || aToken || rToken ? (
    <div className='bg-[#F8F9FD] h-screen flex flex-col'>
      <ToastContainer />
      <Navbar />
      <div className='flex items-start flex-1 min-h-0'>
        <Sidebar />
        <div className='flex-1 h-full min-w-0 overflow-y-auto'>
        <Routes>
          <Route path='/' element={<Navigate to={aToken ? '/admin-dashboard' : dToken ? '/doctor-dashboard' : rToken ? '/reception-patient-check-in' : '/admin-dashboard'} replace />} />
          {/* Admin Route */}
          <Route path='/admin-dashboard' element={<Dashboard />} />
          <Route path='/all-appointments' element={<AllApointments />} />
          <Route path='/all-patients' element={<Patients />} />
          <Route path='/add-doctor' element={<AddDoctor />} />
          <Route path='/doctor-list' element={<DoctorsList />} />
          <Route path='/edit-doctor/:id' element={<EditDoctorProfile />} />
          <Route path='/specialities' element={<Specialities />} />
          <Route path='/speciality-report' element={<SpecialityReport />} />
          <Route path='/staff' element={<Staff />} />
          <Route path='/admin-sessions' element={<SessionSchedule />} />
          <Route path='/admin-session-history' element={<SessionHistory />} />
          {/* Doctor Route */}
          <Route path='/doctor-dashboard' element={<DoctorDashboard />} />
          <Route path='/doctor-appointments' element={<DoctorAppointments />} />
          <Route path='/doctor-patients' element={<DoctorPatient />} />
          <Route path='/doctor-profile' element={<DoctorProfile />} />
          <Route path='/doctor-add-session' element={<DoctorAddSession />} />
          <Route path='/doctor-sessions' element={<DoctorSessionSchedule />} />
          <Route path='/doctor-session-history' element={<DoctorSessionHistory />} />
          <Route path='/doctor-session-appointments/:sessionId' element={<DoctorSessionAppointments />} />
          <Route path='/doctor-session-appointments-history/:sessionId' element={<DoctorSessionAppointmentsHistory     />} />
          {/* Reception Route */}
          <Route path='/reception-patient-check-in' element={<PatientCheckIn />} />
          <Route path='/reception-doctors' element={<DoctorsForReception />} />
          <Route path='/reception-all-appointments' element={<AllAppointmentForReception />} />
          <Route path='/reception-patients' element={<PatientsForReception />} />
          <Route path='/reception-sessions' element={<ReceptionSessions />} />
          <Route path='/reception-session-history' element={<ReceptionSessionHistory />} />
          <Route path='/reception-add-sessions' element={<AddSessions />} />
          <Route path='/reception-refunds' element={<RefundsForReception />} />
          <Route path='/reception-cash-refunds' element={<CashRefundsForReception />} />
          <Route path='/reception-rescheduled-appointments' element={<RescheduledAppointmentsForReception />} />
        </Routes>
        </div>
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
