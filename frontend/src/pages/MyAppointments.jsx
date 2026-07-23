import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const PAYMENT_WINDOW_SECONDS = 10 * 60
const formatMMSS = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

// Shows the "pay within 10 minutes" warning and a live countdown for one appointment
const PaymentBanner = ({ item }) => {
  const getRemaining = () => Math.max(0, PAYMENT_WINDOW_SECONDS - Math.floor((Date.now() - item.date) / 1000))
  const [seconds, setSeconds] = useState(getRemaining())

  useEffect(() => {
    const t = setInterval(() => setSeconds(getRemaining()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className='flex items-center justify-between gap-4 px-4 py-2 text-xs font-medium text-gray-700 bg-gray-50'>
      <span>Complete payment within 10 minutes or this appointment will auto-cancel</span>
      <span className={`font-mono font-semibold ${seconds <= 120 ? 'text-red-600' : 'text-gray-700'}`}>{formatMMSS(seconds)}</span>
    </div>
  )
}

const MyAppointments = () => {

  const { backendUrl, token, getDoctorsData } = useContext(AppContext)
  const navigate = useNavigate()

  const [appointments, setAppointments] = useState([])
  const [payment, setPayment] = useState('')

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);


  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Function to format the date eg. ( 20_01_2000 => 20 Jan 2000 )
  const slotDateFormat = (slotDate) => {
    const dateArray = slotDate.split('_')
    return dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
  }

  //Filter Appointments by Status
  //   const handleStatusFilter = (e) => {
  //   const filter = e.target.value;
  //   if (filter === "completed") {
  //     setAppointments(allAppointments.filter(a => a.isCompleted && !a.cancelled));
  //   } else if (filter === "cancelled") {
  //     setAppointments(allAppointments.filter(a => a.cancelled));
  //   } else {
  //     setAppointments(allAppointments);
  //   }
  // };


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
          const { data } = await axios.post(backendUrl + "/api/user/verifyPayhere", { order_id: orderId, status_code: "2" }, { headers: { token } });

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


      // if (data.success) {
      //   console.log(data.paymentDetails)
      // }

    } catch (error) {
      console.log(error);
      toast.error("Something went wrong: " + error.message);
    }
  };

  const confirmPayOnline = () => {
    if (selectedAppointmentId) {
      appointmentPayHere(selectedAppointmentId);
      setShowPaymentDialog(false);
      setSelectedAppointmentId(null);
    }
  };

  useEffect(() => {
    if (token) {
      getUserAppointments()
    }
  }, [token])

  return (
    <div>
      <div className='flex items-center justify-between pb-3 mt-12 border-b'>
        <p className='text-lg font-medium text-gray-600'>My appointments</p>
      </div>
      <div className='flex flex-col gap-4 mt-4'>
        {appointments.length === 0 && (
          <p className='py-6 text-center text-gray-400'>No appointments available.</p>
        )}
        {appointments.map((item, index) => (
          <div key={index} className='overflow-hidden bg-white border border-gray-200 rounded-lg'>
            {!item.cancelled && !item.payment && !item.isCompleted && <PaymentBanner item={item} />}
            {item.cancelled && item.payment && (
              <div className='px-4 py-2 text-xs font-medium text-left text-black bg-red-50'>
                Your appointment was cancelled. <Link to='/contact' className='underline hover:text-primary'>Contact us</Link>.
              </div>
            )}
            <div className='flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5'>
              <div className='flex items-center gap-4 sm:contents'>
                <div className='shrink-0'>
                  {item.docData.image
                    ? <img className='object-cover w-24 h-24 rounded-md sm:w-32 sm:h-32 bg-[#EAEFFF]' src={`${backendUrl}${item.docData.image}`} alt='' />
                    : <div className='flex items-center justify-center w-24 h-24 rounded-md sm:w-32 sm:h-32 bg-[#EAEFFF]'>
                      <img className='w-14 h-14 sm:w-20 sm:h-20' src={assets.default_doctor_pastel} alt='' />
                    </div>
                  }
                </div>
                <div className='flex-1 min-w-0 text-sm text-[#5E5E5E] flex flex-col justify-center gap-1'>
                  <p className='text-[#262626] text-base font-semibold truncate'>{item.docData.name}</p>
                  <p className='truncate'>{item.docData.speciality}</p>
                  <p className='truncate'><span className='text-sm text-[#3C3C3C] font-medium'>Date & Time:</span> {slotDateFormat(item.slotDate)} | {item.slotTime}</p>
                  {item.tokenNumber && <p className='truncate'><span className='text-sm text-[#3C3C3C] font-medium'>Token No:</span> {item.tokenNumber}</p>}
                  <p className='truncate'><span className='text-sm text-[#3C3C3C] font-medium'>Ref :</span> APT-{item._id.slice(-6).toUpperCase()}</p>
                </div>
              </div>
              <div className='flex flex-col justify-center flex-shrink-0 gap-2 text-sm text-center sm:w-48'>
                {!item.cancelled && !item.payment && !item.isCompleted && payment !== item._id && <button onClick={(e) => {
                  e.preventDefault();
                  // setSelectedAppointmentId(item._id);
                  // setShowPaymentDialog(true);
                  appointmentPayHere(item._id);
                  console.log('Button clicked for appointment ID:', item._id);
                }} className='w-full text-[#696969] py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300'>Pay Online</button>}

                {/* {!item.cancelled && item.payment && !item.isCompleted && <button className='w-full py-2 border rounded text-[#696969]  bg-[#EAEFFF]'>Paid</button>} */}

                {item.isCompleted && <button className='w-full py-2 text-green-500 border border-green-500 rounded'>Completed</button>}

                {!item.cancelled && !item.payment && !item.isCompleted && <button onClick={() => cancelAppointment(item._id)} className='w-full text-[#696969] py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300'>Cancel appointment</button>}
                {item.payment && !item.cancelled && <button className='w-full py-2 border border-stone-500 text-stone-500 bg-indigo-50'>paid</button>}
                {item.payment && !item.reSchedule && !item.cancelled && !item.isCompleted && (
                  <button
                    onClick={() =>
                      navigate(`/reschedule-appointment/${item.docData._id}`, {
                        state: {
                          appointmentId: item._id,
                          slotDate: item.slotDate,
                          slotTime: item.slotTime,
                        },
                      })
                    }
                    className='w-full text-[#696969] py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300'
                  >
                    Reschedule Appointment
                  </button>
                )}
                {item.cancelled && !item.isCompleted && !item.payment && <button className='w-full py-2 text-red-500 border border-red-500 rounded'>Appointment cancelled</button>}
                {item.payment && item.cancelled && (
                  <button className='w-full text-[#696969] py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300'>
                    Refund Request
                  </button>
                )}

              </div>
              {/* {showPaymentDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
                <div className="bg-white rounded-lg shadow-lg p-6 w-[320px]">

                  <h2 className="mb-4 text-lg font-semibold text-gray-800">Confirm Payment</h2>
                  <p className="mb-4 text-sm text-gray-600">
                    Are you sure you want to proceed with online payment?<br />
                    Once paid, you will <strong>not</strong> be able to cancel this appointment.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowPaymentDialog(false);
                        setSelectedAppointmentId(null);
                      }}
                      className="px-4 py-2 text-gray-800 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      No
                    </button>
                    <button
                      onClick={confirmPayOnline}
                      className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                      Yes, Pay Now
                    </button>
                  </div>
                </div>
              </div>
            )} */}

            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MyAppointments
