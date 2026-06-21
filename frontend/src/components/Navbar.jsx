import React, { useContext, useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext';

const Navbar = () => {

  const navigate = useNavigate();

  const { token, setToken, userData, backendUrl } = useContext(AppContext)

  const [showMenu, setshowMenu] = useState(false)

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const [avatarError, setAvatarError] = useState(false)

  useEffect(() => {
    setAvatarError(false)
  }, [userData?.image])

  // const logout = () => {
  //   localStorage.removeItem('token')
  //   setToken(false)
  //   setShowLogoutDialog(false);
  //   navigate('/')
  // }

  const logout = () => {
    setShowLogoutDialog(true); // only show the dialog
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    setToken(false);
    setShowLogoutDialog(false);
    navigate('/');
  };



  const avatarContent = userData?.image && userData.image.startsWith('/uploads/') && !avatarError
    ? <img className='object-cover w-8 h-8 rounded-full' src={`${backendUrl}${userData.image}`} onError={() => setAvatarError(true)} alt="" />
    : <div className='flex items-center justify-center w-8 h-8 font-semibold text-white uppercase bg-blue-500 rounded-full'>
      {userData?.name?.charAt(0)}
    </div>

  return (
    <div className='flex items-center justify-between py-1 mb-5 text-sm border-b border-b-gray-400'>  {/* py-4 */}
      <img onClick={() => navigate('/')} className='-ml-2 cursor-pointer w-44' src={assets.logo} alt="" /> {/*Margin left edited*/}
      <ul className='items-start hidden gap-5 font-medium md:flex'>
        <NavLink to='/'>
          <li className='py-1'>HOME</li>
          <hr className='outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/doctors'>
          <li className='py-1'>ALL DOCTORS</li>
          <hr className='outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/about'>
          <li className='py-1'>ABOUT</li>
          <hr className='outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to='/contact'>
          <li className='py-1'>CONTACT US</li>
          <hr className='outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
        </NavLink>
      </ul>
      <div className='flex items-center gap-4'>
        {
          token && userData
            ? <div className='relative items-center hidden gap-2 cursor-pointer group md:flex'>
              {avatarContent}
              <img className='w-2.5' src={assets.dropdown_icon} alt="" />
              <div className='absolute top-0 right-0 z-20 hidden text-base font-medium text-gray-600 pt-14 group-hover:block'>

                <div className='flex flex-col gap-4 p-4 mr-4 rounded min-w-48 bg-stone-100'>

                  <p onClick={() => navigate('my-profile')} className='cursor-pointer hover:text-black'>My Profile</p>
                  <p onClick={() => navigate('my-appointment')} className='cursor-pointer hover:text-black'>My Appointments</p>
                  {/* <p onClick={logout} className='cursor-pointer hover:text-black'>Logout</p> */}
                  <p onClick={logout} className='cursor-pointer hover:text-black'>Logout</p>
                </div>
              </div>
            </div>
            : <button onClick={() => navigate('/login')} className='hidden px-8 py-3 font-light text-white rounded-full bg-[#64748B] md:block'>Create account</button>
        }
        {
          token && userData
            ? <div onClick={() => setshowMenu(true)} className='cursor-pointer md:hidden'>{avatarContent}</div>
            : <img onClick={() => setshowMenu(true)} className='w-6 md:hidden' src={assets.menu_icon} alt="" />
        }
        {/* Mobile Menu*/}
        <div className={` ${showMenu ? 'fixed w-full' : 'h-0 w-0'} md:hidden right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>
          <div className='flex items-center justify-between px-5 py-6'>
            <img className='w-36' src={assets.logo} alt="" />
            <img className='w-7' onClick={() => setshowMenu(false)} src={assets.cross_icon} alt="" />
          </div>
          <ul className='flex flex-col items-center gap-2 px-5 mt-5 text-lg font-medium'>
            <NavLink onClick={() => setshowMenu(false)} to=''><p className='inline-block px-2 py-2 rounded'>HOME</p></NavLink>
            <NavLink onClick={() => setshowMenu(false)} to='/doctors'><p className='inline-block px-2 py-2 rounded'>ALL DOCTORS</p></NavLink>
            <NavLink onClick={() => setshowMenu(false)} to='/about'><p className='inline-block px-2 py-2 rounded'>ABOUT</p></NavLink>
            <NavLink onClick={() => setshowMenu(false)} to='/contact'><p className='inline-block px-2 py-2 rounded'>CONTACT</p></NavLink>
          </ul>
        </div>

      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[300px]">
            <h2 className="mb-4 text-lg font-semibold">Are you sure you want to logout?</h2>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="px-4 py-2 text-gray-800 bg-gray-300 rounded hover:bg-gray-400"
              >
                No
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Navbar
