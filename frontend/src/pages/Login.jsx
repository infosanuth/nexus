import React, { useState, useContext, useEffect } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom'

const Login = () => {

  const [state, setState] = useState('Sign Up')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [nic, setNic] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  const navigate = useNavigate()

  const { backendUrl, token, setToken } = useContext(AppContext)


  const onSubmitHandler = async (event) => {
    
    try {

      event.preventDefault()

      if (state === 'Sign Up') {

        if (password.length < 8 || password.length > 20) {
          toast.error("Password must be 8-20 characters long")
          return
        }

        let hasDigit = false
        for (let i = 0; i < password.length; i++) {
          if (password[i] >= '0' && password[i] <= '9') {
            hasDigit = true
            break
          }
        }
        if (!hasDigit) {
          toast.error("Password must contain at least one digit")
          return
        }

        let hasLetter = false
        for (let i = 0; i < password.length; i++) {
          const ch = password[i]
          if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
            hasLetter = true
            break
          }
        }
        if (!hasLetter) {
          toast.error("Password must contain at least one letter")
          return
        }

        if (password !== confirmPassword) {
          toast.error("Passwords do not match")
          return
        }

        const { data } = await axios.post(backendUrl + '/api/user/register', { name, email, password, phoneNumber, nic })

        if (data.success) {
          navigate('/email-veify', { state: { email } })
        } else {
          toast.error(data.message)
        }

      } else {

        const { data } = await axios.post(backendUrl + '/api/user/login', { email, password })

        if (data.success) {
          localStorage.setItem('token', data.token)
          setToken(data.token)
        } else {
          toast.error(data.message)
        }

      }
    } catch (error) {
      console.log(error.message)
      toast.error(error.message)
    }
  }
  useEffect(() => {
    if (token) {
      navigate('/')
    }
  }, [token])

  return (
    <form onSubmit={onSubmitHandler} className='min-h-[80vh] flex items-center'>
      <div className='flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg'>
        <p className='text-2xl font-semibold'>{state === 'Sign Up' ? "Create Account" : "Login"}</p>
        <p>Please {state === 'Sign Up' ? "sign up" : "log in"} to book appointment</p>
        {
          state === "Sign Up" &&
          <div className='w-full'>
            <p>Full Name</p>
            <input className='w-full p-2 mt-1 border rounded border-zinc-300' type="text" onChange={(e) => setName(e.target.value)} value={name} required />
            <p>NIC</p>
            <input className='w-full p-2 mt-1 border rounded border-zinc-300' type="text" onChange={(e) => setNic(e.target.value)} value={nic} required />
            <p>Phone Number</p>
            <input className='w-full p-2 mt-1 border rounded border-zinc-300' type="text" onChange={(e) => setPhoneNumber(e.target.value)} value={phoneNumber} required />
          </div>
        }
        <div className='w-full'>
          <p>Email</p>
          <input className='w-full p-2 mt-1 border rounded border-zinc-300' type="email" onChange={(e) => setEmail(e.target.value)} value={email} required />
        </div>
        <div className='w-full'>
          <p>Password</p>
          <input className='w-full p-2 mt-1 border rounded border-zinc-300' type="password" onChange={(e) => setPassword(e.target.value)} value={password} required />
        </div>

        {state === "Sign Up" &&
          <div className='w-full'>
            <p>Confirm Password</p>
            <input className='w-full p-2 mt-1 border rounded border-zinc-300' type="password" onChange={(e) => setConfirmPassword(e.target.value)} value={confirmPassword} required />
          </div>
        }

        {state === "Login" &&
          <p onClick={() => navigate('/reset-password')} className='underline cursor-pointer text-primary'>Forgot password?</p>
        }

        <button type='submit' className='bg-[#64748B] text-white w-full py-2 rounded-md text-base'>{state === 'Sign Up' ? "Create Account" : "Login"}</button>
        {
          state === "Sign Up"
            ? <p>Already have an account? <span onClick={() => setState('Login')} className='underline cursor-pointer text-primary'>Login here</span> </p>
            : <p>Create an new account? <span onClick={() => setState('Sign Up')} className='underline cursor-pointer text-primary'>Click here</span> </p>
        }
      </div>
    </form>
  )
}

export default Login
