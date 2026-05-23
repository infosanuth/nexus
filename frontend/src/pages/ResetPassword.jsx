import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const ResetPassword = () => {

  const { backendUrl, token } = useContext(AppContext)

  const inputRefs = React.useRef([])

  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')

  const [isEmailSent, setIsEmailsent] = useState('')
  const [otp, setOtp] = useState(0)
  const [isOtpSubmited, setIsOtpSubmited] = useState(false)

  const handleInput = (e, index) => {
    if (e.target.value.length > 0 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  }

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text')
    const pasteArray = paste.split('')
    pasteArray.forEach((char, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index].value = char;
      }
    })
  }

  const onSubmitEmail = async (event) => {

    event.preventDefault()

    try {
      const { data } = await axios.post(backendUrl + '/api/user/send-reset-otp', { email }, { headers: { token } })
      if (data.success) {
        toast.success(data.message)
        setIsEmailsent(true)
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.log(error.message)
      toast.error(error.message)
    }
  }

  const onSubmitOtp = async (e) => {
    e.preventDefault()
    const otpArray = inputRefs.current.map(e => e.value)
    setOtp(otpArray.join(''))
    setIsOtpSubmited(true)

  }

  const onSubmitNewPassword = async (e) => {
    e.preventDefault()
    try {
      const { data } = await axios.post(backendUrl + '/api/user/reset-password', { otp, email, newPassword }, { headers: { token } });
      if (data.success) {
        toast.success(data.message)
        navigate('/login')
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  return (
    <div className='flex items-center justify-center min-h-screen bg-white'>
      {!isEmailSent &&
        <form onSubmit={onSubmitEmail} className='bg-slate-200 p-8 rounded-lg w-96 text-sm'>
          <h1 className='text-2xl font-semibold text-center mb-4'>Reset password</h1>
          <p className='text-center mb-6 text-blue-800'>Enter your verified email</p>

          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-white'>
            <input type="email" placeholder='Email id' className='outline-none' value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <button className='w-full py-2.5 border bg-gray-700 mt-3 text-white rounded-full'>Submit</button>
        </form>
      }

      {!isOtpSubmited && isEmailSent &&
        <form onSubmit={onSubmitOtp} className='bg-slate-200 p-8 rounded-lg w-96 text-sm'>
          <h1 className='text-2xl font-semibold text-center mb-4'>Reset Password OTP</h1>
          <p className='text-center mb-6 text-blue-800'>Enter the 6-digit code sent to your email id.</p>

          <div className='flex justify-between mb-8' onPaste={handlePaste}>
            {Array(6).fill(0).map((_, index) => (
              <input type='text' maxLength='1' key={index} required className='w-12 h-12 bg-slate-400 text-black text-center text-xl rounded-md'
                ref={e => inputRefs.current[index] = e}
                onInput={(e) => handleInput(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)} />
            ))}

          </div>
          <button className='w-full py-2.5 border border-slate-600 rounded-full'>Submit</button>
        </form>
      }

      {isOtpSubmited && isEmailSent &&
        <form onSubmit={onSubmitNewPassword} className='bg-slate-200 p-8 rounded-lg w-96 text-sm'>
          <h1 className='text-2xl font-semibold text-center mb-4'>New password</h1>
          <p className='text-center mb-6 text-blue-800'>Enter the new password bellow</p>

          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-white'>
            <input type="password" placeholder='Password' className='outline-none' value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          </div>
          <button className='w-full py-2.5 border bg-gray-700 mt-3 text-white rounded-full'>Submit</button>
        </form>
      }

    </div>
  )
}

export default ResetPassword
