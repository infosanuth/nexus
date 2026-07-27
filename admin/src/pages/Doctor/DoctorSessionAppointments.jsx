import React, { useContext, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'

const DoctorSessionAppointments = () => {

  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { dToken, sessionDetails, sessionAppointments, getSessionAppointments, completeSessionAppointment } = useContext(DoctorContext)
  const { calculateAge } = useContext(AppContext)

  useEffect(() => {
    if (dToken && sessionId) {
      getSessionAppointments(sessionId)
    }
  }, [dToken, sessionId])

  return (
    <div className='w-full max-w-6xl m-5'>

      <div className='flex items-center gap-3 mb-3'>
        <button
          onClick={() => navigate('/doctor-sessions')}
          className='flex items-center justify-center w-8 h-8 text-gray-500 transition-colors bg-white border rounded-lg hover:border-gray-300 hover:text-gray-800'
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className='text-lg font-medium'>Session Appointments</p>
          {sessionDetails && (
            <p className='text-xs text-gray-400'>
              {new Date(sessionDetails.date).toLocaleDateString('en-GB')} &middot; {sessionDetails.startTime}{sessionDetails.endTime ? ` - ${sessionDetails.endTime}` : ''}
            </p>
          )}
        </div>
      </div>

      <div className='bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll'>
        <div className='max-sm:hidden grid grid-cols-[0.5fr_1fr_2fr_1fr_1fr_1fr] gap-1 py-3 px-6 border-b'>
          <p>#</p>
          <p>Ref</p>
          <p>Patient</p>
          <p className='text-center'>Age</p>
          <p>Gender</p>
          <p className='text-center'>Action</p>
        </div>

        {sessionAppointments.length === 0
          ? <p className='p-6 text-gray-500'>No appointments booked for this session</p>
          : sessionAppointments.map((item, index) => (
            <div className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_1fr_2fr_1fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={item._id}>
              <p className='max-sm:hidden'>{index + 1}</p>
              <p>{item.ref || '-'}</p>
              <p>{item.userData.name}</p>
              <p className='text-center'>{item.userData.age || calculateAge(item.userData.dob)}</p>
              <p>{item.userData.gender || 'Not Selected'}</p>
              <div className='flex justify-center'>
                <img
                  onClick={() => !item.isCompleted && completeSessionAppointment(item._id, sessionId)}
                  className={`w-8 ${item.isCompleted ? 'opacity-40' : 'cursor-pointer'}`}
                  src={assets.tick_icon}
                  title={item.isCompleted ? 'Completed' : 'Mark as completed'}
                  alt=''
                />
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}

export default DoctorSessionAppointments
