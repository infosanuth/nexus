import React from 'react'
import {assets} from '../assets/assets'
import { NavLink } from 'react-router-dom'

const Navbar = () => {
  return (
    <div className='flex items-center justify-between py-4 mb-5 text-sm border-b border-b-gray-400'>
      <img className='cursor-pointer w-44' src={assets.logo} alt=""/>
      <ul className='items-start hidden gap-5 font-medium md:flex'>
        <NavLink to='/'>
            <li className='py-1'>HOME</li>
            <hr className='outline-none h-0.5 bg-primary w-3/5 m-auto hidden'/>
        </NavLink>
        <NavLink to='/doctors'>
            <li className='py-1'>ALL DOCTORS</li>
            <hr className='outline-none h-0.5 bg-primary w-3/5 m-auto hidden'/>
        </NavLink>
        <NavLink to='/about'>
            <li className='py-1'>ABOUT</li>
            <hr className='outline-none h-0.5 bg-primary w-3/5 m-auto hidden'/>
        </NavLink>
        <NavLink to='/contact'>
            <li className='py-1'>CONTACT US</li>
            <hr className='outline-none h-0.5 bg-primary w-3/5 m-auto hidden'/>
        </NavLink>
      </ul>
      <div className='flex items-center gap-4'>
        <button className='hidden px-8 py-3 font-light text-white rounded-full bg-[#5f6FFF] md:block'>Create account</button>
      </div>
    </div>
  )
}

export default Navbar
