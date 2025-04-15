import React from 'react'
import { assets } from '../assets/assets'


const Footer = () => {
  return (
    <div className='md:mx-10'>
        <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>

            {/* Left Side */}
            <div>
                <img className='mb-5 w-40 -ml-2' src={assets.logo} alt="" /> {/*Margin left edited*/}
                <p className='w-full md:w-2/3 text-gray-600 leading-6'>Nexus Hospital, a leading healthcare institution in Sri Lanka, has been serving the nation since 1973. With over 50 years of excellence, we are proud to have a team of highly dedicated, skilled, and experienced healthcare professionals committed to patient care</p>
            </div>

            {/* Center */}
            <div>
                <p className='text-xl font-medium mb-5'>COMPANY</p>
                <ul className='flex flex-col gap-2 text-gray-600'>
                  <li>Home</li>
                  <li>About us</li>
                  <li>Contact us</li>
                  <li>Privacy policy</li>
                </ul>
            </div>

            {/* Right Side */}
            <div>
                <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
                <ul className='flex flex-col gap-2 text-gray-600'>
                  <li>+94-123-456-789</li>
                  <li>nexushospital@gmail.com</li>
                </ul>
            </div>
        </div>

        {/* Copyright Text */} 
        <div>
          <hr />
          <p className='py-5 text-sm text-center font-semibold'>Copyright © 2025 Nexus Hospitals PLC - All Right Reserved.</p>
        </div>
    </div>
  )
}

export default Footer
