import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'


const MyAppointments = () => {

  const { backendUrl, token, getDoctorsData } = useContext(AppContext)
  const navigate = useNavigate()

  const [appointments, setAppointments] = useState([])
  const [payment, setPayment] = useState('')

  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Function to format the date eg. ( 20_01_2000 => 20 Jan 2000 )
  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split('_')
    return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
  }


  // Getting User Appointments Data Using API
  const getUserAppointments = async () => {
    try {

      const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
      setAppointments(data.appointments.reverse())
      console.log(data.appointments)

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  // Function to cancel appointment Using API
  const cancelAppointment = async (appointmentId) => {

    try {

      // console.log(appointmentId)
      const { data } = await axios.post(backendUrl + '/api/user/cancel-appointment', { appointmentId }, { headers: { token } })

      if (data.success) {
        toast.success(data.message)
        getUserAppointments()
        getDoctorsData()
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }

  }


  // Function to make payment using payhere
  const appointmentPayHere = async (appointmentId) => {
    // console.log('appointmentPayHere called with ID:', appointmentId);
    try {

      if (!window.payhere || typeof window.payhere.startPayment !== 'function') {
        toast.error("PayHere SDK not loaded. Please try again later.");
        return;
      }

      const { data } = await axios.post(backendUrl + '/api/user/payment-payhere', { appointmentId }, { headers: { token } });
      console.log('API response:', data);

      if (!data.success) {
        toast.error(data.message);
        return;
      }

      const payment = data.paymentDetails;

      // Setup PayHere callbacks

      // window.payhere.onCompleted = function (orderId) {
      //   toast.success(`Payment completed. Order ID: ${orderId}`);
      //   getUserAppointments();
      // };

      window.payhere.onCompleted = async function (orderId) {
        toast.info(`Payment completed. Verifying payment...`);

        try {
          const { data } = await axios.post(backendUrl + "/api/user/verifyPayhere",{ order_id: orderId, status_code: "2" }, { headers: { token } });

          if (data.success) {
            toast.success("Payment verified successfully!");
          } else {
            toast.error("Payment verification failed.");
          }

          navigate('/my-appointment')
          getUserAppointments();
        } catch (error) {
          console.error("PayHere verify error:", error);
          toast.error("Error verifying payment.");
        }
      };

      window.payhere.onDismissed = function () {
        toast.info("Payment was cancelled.");
        getUserAppointments();
      };

      window.payhere.onError = function (error) {
        toast.error("Payment error: " + error);
      };

      // Start PayHere payment popup
      console.log("Sending to PayHere:", payment);
      console.log("Using SDK:", window.payhere);
      console.log("Merchant ID:", payment.merchant_id);
      console.log("Calling payhere.startPayment with:", data.paymentDetails);
      window.payhere.startPayment(payment);
      console.log("Called startPayment");


      // if(data.success){
      //   console.log(data.paymentDetails)
      // }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong: " + error.message);
    }
  };


  useEffect(() => {
    if (token) {
      getUserAppointments()
    }
  }, [token])

  return (
    <div>
      <p className='pb-3 mt-12 text-lg font-medium text-gray-600 border-b'>My appointments</p>
      <div className=''>
        {appointments.map((item, index) => (
          <div key={index} className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b'>
            <div>
              <img className='w-36 bg-[#EAEFFF]' src={`http://localhost:4000${item.docData.image}`} alt="" />
            </div>
            <div className='flex-1 text-sm text-[#5E5E5E]'>
              <p className='text-[#262626] text-base font-semibold'>{item.docData.name}</p>
              <p>{item.docData.speciality}</p>
              <p className='text-[#464646] font-medium mt-1'>Address:</p>
              <p className=''>{item.docData.address.line1}</p>
              <p className=''>{item.docData.address.line2}</p>
              <p className=' mt-1'><span className='text-sm text-[#3C3C3C] font-medium'>Date & Time:</span> {slotDateFormat(item.slotDate)} |  {item.slotTime}</p>
            </div>
            <div></div>
            <div className='flex flex-col gap-2 justify-end text-sm text-center'>
              {!item.cancelled && !item.payment && !item.isCompleted && payment !== item._id && <button onClick={(e) => { e.preventDefault(); console.log('Button clicked for appointment ID:', item._id); appointmentPayHere(item._id) }} className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300'>Pay Online</button>}

              {/* {!item.cancelled && item.payment && !item.isCompleted && <button className='sm:min-w-48 py-2 border rounded text-[#696969]  bg-[#EAEFFF]'>Paid</button>} */}

              {item.isCompleted && <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500'>Completed</button>}
              {!item.cancelled && !item.payment && !item.isCompleted &&  <button className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300'>Reschedule Appointment</button>}

              {!item.cancelled && !item.payment && !item.isCompleted && <button onClick={() => cancelAppointment(item._id)} className='text-[#696969] sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300'>Cancel appointment</button>}
              {item.payment && <button className='sm:min-w-48 py-2 border border-stone-500 text-stone-500 bg-indigo-50'>paid</button>}
              {item.cancelled && !item.isCompleted && <button className='sm:min-w-48 py-2 border border-red-500 rounded text-red-500'>Appointment cancelled</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MyAppointments

