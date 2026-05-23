// // src/pages/AppointmentsByDoctor.jsx

// import React, { useEffect, useState } from 'react'
// import { useLocation } from 'react-router-dom'
// import axios from 'axios'
// import { toast } from 'react-toastify'
// import { useContext } from 'react'
// import { AdminContext } from '../../context/AdminContext'



// const AppointmentsByDoctor = () => {
//   const location = useLocation()
//   const { doctorId, doctorName } = location.state || {}

//   const [appointments, setAppointments] = useState([])
//   const { backendUrl, aToken } = useContext(AdminContext)

// //   const filteredAppointments = appointments.filter(app => app.docId === doctorId);

//   useEffect(() => {
//     if (aToken) {
//       fetchAppointments()
//     }
//   }, [[aToken]])



//   const fetchAppointments = async () => {
//     try {
//       const { data } = await axios.post(
//         backendUrl + '/api/admin/appointments-doctor',
//         { docId: doctorId },
//         { headers: { aToken } }
//       )

//       if (data.success) {
//         setAppointments(data.appointments)
//       } else {
//         toast.error(data.message)
//       }
//     } catch (err) {
//       console.error(err)
//       toast.error(err.message)
//     }
//   }

//   return (
//     <div className="p-6">
//       <h2 className="text-xl font-semibold mb-4">
//         Appointments for {doctorName || 'Doctor'}
//       </h2>

//       {appointments.length === 0 ? (
//         <p>No appointments found.</p>
//       ) : (
//         <div className="bg-white border rounded text-sm">
//           <div className="grid grid-cols-[40px_2fr_2fr_1fr] font-medium border-b bg-gray-100 px-4 py-2">
//             <p>#</p>
//             <p>Patient</p>
//             <p>Date & Time</p>
//             <p>Status</p>
//           </div>
//           {appointments.map((item, index) => (
//             <div
//               key={item._id}
//               className="grid grid-cols-[40px_2fr_2fr_1fr] border-b px-4 py-2 items-center"
//             >
//               <p>{index + 1}</p>
//               <p>{item.userData?.name || 'N/A'}</p>
//               <p>{item.slotDate}, {item.slotTime}</p>
//               <p>{item.cancelled ? 'Cancelled' : item.isCompleted ? 'Completed' : 'Scheduled'}</p>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   )
// }

// export default AppointmentsByDoctor

import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AdminContext } from '../../context/AdminContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const AppointmentsByDoctor = () => {
    const { backendUrl, aToken } = useContext(AdminContext)
    const { doctorId } = useParams()
    const [appointments, setAppointments] = useState([])
    const [doctorName, setDoctorName] = useState('')

    useEffect(() => {
        if (aToken) {
            fetchAppointments()
        }
    }, [aToken])



    const fetchAppointments = async () => {
        try {
            console.log('Fetching appointments for doctorId:', doctorId)  // << Add this
            const { data } = await axios.post(backendUrl + '/api/admin/appointments-doctor', { doctorId }, { headers: { aToken } })


            console.log('Response data:', data)  // << Add this


            if (data.success) {
                setAppointments(data.appointments)

                if (data.appointments.length > 0) {
                    setDoctorName(data.appointments[0].docData?.name || '')
                }
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to fetch appointments.')
        }
    }


    return (
        <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">
                Appointments for {doctorName || 'Doctor'}
            </h2>

            {appointments.length === 0 ? (
                <p>No appointments found.</p>
            ) : (
                <div className="bg-white border rounded text-sm">
                    <div className="grid grid-cols-[40px_2fr_1.5fr_1fr_1fr] gap-x-4 font-medium border-b bg-gray-100 px-4 py-2">
                        <p>#</p>
                        <p>Patient</p>
                        <p>Date</p>
                        <p>Time</p>
                        <p>Status</p>
                    </div>
                    {appointments.map((item, index) => {
                        let statusColor = 'text-blue-600'; // pending by default
                        if (item.cancelled) statusColor = 'text-red-600';
                        else if (item.isCompleted) statusColor = 'text-green-600';

                        return (
                            <div
                                key={item._id}
                                className="grid grid-cols-[40px_2fr_1.5fr_1fr_1fr] gap-x-4 border-b px-4 py-2 items-center"
                            >
                                <p>{index + 1}</p>
                                <p>{item.userData?.name || 'N/A'}</p>
                                <p>{item.slotDate}</p>
                                <p>{item.slotTime}</p>
                                <p className={statusColor}>
                                    {item.cancelled ? 'Cancelled' : item.isCompleted ? 'Completed' : 'Pending'}
                                </p>
                            </div>
                        );
                    })}
                </div>


            )}
        </div>
    )
}

export default AppointmentsByDoctor

