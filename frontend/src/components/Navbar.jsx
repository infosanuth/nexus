import React, { useState } from 'react'
import {assets} from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'


const Navbar = () => {

  const navigate = useNavigate();
  
  const [showMenu, setshowMenu] = useState(false)
  const [token, setToken] = useState(true)
  
  return (
    <div className='flex items-center justify-between py-1 mb-5 text-sm border-b border-b-gray-400'>  {/* py-4 */}
      <img onClick={()=>navigate('/')} className='cursor-pointer w-44 -ml-2' src={assets.logo} alt=""/> {/*Margin left edited*/}
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
        {
          token
          ? <div className='relative flex items-center gap-2 cursor-pointer group'>
              <img className='w-8 rounded-full' src={assets.profile_pic} alt=""/>
              <img className='w-2.5' src={assets.dropdown_icon} alt=""/>
              <div className='absolute top-0 right-0 z-20 hidden text-base font-medium text-gray-600 pt-14 group-hover:block'>
                <div className='flex flex-col gap-4 p-4 rounded min-w-48 bg-stone-100'>
                  <p onClick={()=>navigate('my-profile')} className='cursor-pointer hover:text-black'>My Profile</p>
                  <p onClick={()=>navigate('my-appointment')} className='cursor-pointer hover:text-black'>My Appointments</p>
                  <p onClick={()=>setToken(false)} className='cursor-pointer hover:text-black'>Logout</p>
                </div>
              </div>
            </div>
          :<button onClick={()=>navigate('/login')} className='hidden px-8 py-3 font-light text-white rounded-full bg-[#5f6FFF] md:block'>Create account</button>
        }
        <img onClick={()=>setshowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="" />
        {/* Mobile Menu*/}
        <div className={` ${showMenu ? 'fixed w-full' : 'h-0 w-0'} md:hidden right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>
          <div className='flex items-center justify-between px-5 py-6'>
            <img className='w-36' src={assets.logo} alt="" />
            <img className='w-7' onClick={()=>setshowMenu(false)} src={assets.cross_icon} alt="" />
          </div>
          <ul className='flex flex-col items-center gap-2 mt-5 px-5 text-lg font-medium'>
            <NavLink onClick={()=>setshowMenu(false)} to=''><p className='px-2 py-2 rounded inline-block'>HOME</p></NavLink>
            <NavLink onClick={()=>setshowMenu(false)} to='/doctors'><p className='px-2 py-2 rounded inline-block'>ALL DOCTORS</p></NavLink>
            <NavLink onClick={()=>setshowMenu(false)} to='/about'><p className='px-2 py-2 rounded inline-block'>ABOUT</p></NavLink>
            <NavLink onClick={()=>setshowMenu(false)} to='/contact'><p className='px-2 py-2 rounded inline-block'>CONTACT</p></NavLink>
          </ul>
        </div>
        
      </div>
    </div>
  )
}

export default Navbar
