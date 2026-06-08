import React, { useContext, useState } from 'react'
import { AdminContext } from '../context/AdminContext'
import { DoctorContext } from '../context/DoctorContext'
import { ReceptionContext } from '../context/ReceptionContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const Login = () => {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { backendUrl } = useContext(DoctorContext)
  const { setAToken } = useContext(AdminContext)
  const { setDToken } = useContext(DoctorContext)
  const { setRToken } = useContext(ReceptionContext)

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    try {
      const { data } = await axios.post(backendUrl + '/api/auth/login', { email, password })

      if (!data.success) {
        return toast.error(data.message)
      }

      const { token, role } = data

      if (role === 'admin') {
        localStorage.setItem('aToken', token)
        setAToken(token)
      } else if (role === 'doctor') {
        localStorage.setItem('dToken', token)
        setDToken(token)
      } else if (role === 'receptionist') {
        localStorage.setItem('rToken', token)
        setRToken(token)
      } else {
        toast.error('Unknown role. Contact administrator.')
      }

    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-[#5E5E5E] text-sm shadow-lg'>
        <p className='m-auto text-2xl font-semibold'>
          <span className='text-[#5F6FFF]'>Staff</span> Login
        </p>
        <div className='w-full'>
          <p>Email</p>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            className='border border-[#DADADA] rounded w-full p-2 mt-1'
            type="email"
            required
          />
        </div>
        <div className='w-full'>
          <p>Password</p>
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            className='border border-[#DADADA] rounded w-full p-2 mt-1'
            type="password"
            required
          />
        </div>
        <button className='bg-[#5F6FFF] text-white w-full py-2 rounded-md text-base'>
          Login
        </button>
      </div>
    </form>
  )
}

export default Login
