import React, { useContext, useEffect } from 'react'
import { AppContext } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const EmailVerify = () => {

  const inputRefs = React.useRef([])

  const { backendUrl, setToken } = useContext(AppContext)

  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email

  useEffect(() => {
    if (!email) {
      navigate('/login')
    }
  }, [email])

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

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault();
      
      const otpArray = inputRefs.current.map(e => e.value)
      const otp = otpArray.join('')

      const { data } = await axios.post(backendUrl + '/api/user/verify-account', { email, otp });

      if (data.success) {
        toast.success(data.message)
        localStorage.setItem('token', data.token)
        setToken(data.token)
        navigate('/')
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
      <form onSubmit={onSubmitHandler} className='p-8 text-sm rounded-lg bg-slate-200 w-96'>
        <h1 className='mb-4 text-2xl font-semibold text-center'>Email Verify OTP</h1>
        <p className='mb-6 text-center text-blue-800'>Enter the 6-digit code sent to your email id.</p>

        <div className='flex justify-between mb-8' onPaste={handlePaste}>
          {Array(6).fill(0).map((_, index) => (
            <input type='text' maxLength='1' key={index} required className='w-12 h-12 text-xl text-center text-black rounded-md bg-slate-400'
              ref={e => inputRefs.current[index] = e}
              onInput={(e) => handleInput(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)} />
          ))}

        </div>
        <button className='w-full py-3 border rounded-full border-slate-600'>Verify Email</button>
      </form>
    </div>
  )
}

export default EmailVerify
