import React, { useContext, useState, useEffect, } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const MyProfile = () => {

  const { userData, setUserData, backendUrl, token, loadUserProfileData, changeMyPassword } = useContext(AppContext)

  const [isEdit, setIsEdit] = useState(false)

  const [image, setImage] = useState(false)

  const [imgError, setImgError] = useState(false)

  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')

  const [newPassword, setNewPassword] = useState('')

  const [confirmPassword, setConfirmPassword] = useState('')

  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [userData?.image])

  const defaultProfileImage = `${backendUrl}/uploads/1751637786932-upload_area.png`

  const profileImageSrc = userData?.image && userData.image.startsWith('/uploads/') && !imgError
    ? `${backendUrl}${userData.image}`
    : defaultProfileImage

  const hasProfileImage = Boolean(image) || (userData?.image && userData.image.startsWith('/uploads/') && !imgError)

  // Function to update user profile data using API
  const updateUserProfileData = async () => {

    const today = new Date().toISOString().split('T')[0]
    const minDob = new Date(new Date().setFullYear(new Date().getFullYear() - 120)).toISOString().split('T')[0]

    if (userData.dob && userData.dob > today) {
      toast.error('Date of birth cannot be in the future')
      return
    }

    if (userData.dob && userData.dob < minDob) {
      toast.error('Invalid date of birth. Maximum allowed age is 120 years')
      return
    }

    try {

      const formData = new FormData();

      formData.append('userId', userData._id);
      formData.append('name', userData.name)
      formData.append('phoneNumber', userData.phoneNumber)
      formData.append('address', JSON.stringify(userData.address))
      formData.append('gender', userData.gender)
      formData.append('dob', userData.dob)

      image && formData.append('image', image)

      const { data } = await axios.post(backendUrl + '/api/user/update-profile', formData, { headers: { token } })

      if (data.success) {
        toast.success(data.message)
        await loadUserProfileData()
        setIsEdit(false)
        setImage(false)
      } else {
        toast.error(data.message)
      }

    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }

  }

  const resetPasswordForm = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  // Function to change account password using API
  const handleChangePassword = async () => {

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }

    if (newPassword.length < 8 || newPassword.length > 20) {
      toast.error('New password must be 8-20 characters long')
      return
    }

    let hasDigit = false
    for (let i = 0; i < newPassword.length; i++) {
      if (newPassword[i] >= '0' && newPassword[i] <= '9') {
        hasDigit = true
        break
      }
    }
    if (!hasDigit) {
      toast.error('New password must contain at least one digit')
      return
    }

    let hasLetter = false
    for (let i = 0; i < newPassword.length; i++) {
      const ch = newPassword[i]
      if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')) {
        hasLetter = true
        break
      }
    }
    if (!hasLetter) {
      toast.error('New password must contain at least one letter')
      return
    }

    let hasSpecialChar = false
    for (let i = 0; i < newPassword.length; i++) {
      if (newPassword[i] === '@' || newPassword[i] === '#' || newPassword[i] === '$') {
        hasSpecialChar = true
        break
      }
    }
    if (!hasSpecialChar) {
      toast.error('New password must contain at least one special character (@, #, $)')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match')
      return
    }

    if (newPassword === currentPassword) {
      toast.error('New password must be different from current password')
      return
    }

    setSavingPassword(true)
    const success = await changeMyPassword(currentPassword, newPassword)
    setSavingPassword(false)

    if (success) {
      resetPasswordForm()
      setShowPasswordForm(false)
    }
  }

  return userData && (
    <div className='flex flex-col max-w-lg gap-2 text-sm'>

      {
        isEdit
          ? <label htmlFor='image'>
            <div className='relative inline-block cursor-pointer'>
              <img className={`w-28 h-28 sm:w-36 sm:h-36 rounded object-cover ${hasProfileImage ? 'opacity-75' : ''}`} src={image ? URL.createObjectURL(image) : profileImageSrc} onError={() => !image && setImgError(true)} alt="" />
            </div>
            <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden />
          </label>
          : <img className='object-cover rounded w-28 h-28 sm:w-36 sm:h-36' src={profileImageSrc} onError={() => setImgError(true)} alt="" />
      }

      {
        isEdit
          ? <input className='w-full mt-4 text-2xl font-medium bg-gray-100 sm:text-3xl max-w-60' type="text" value={userData.name} onChange={e => setUserData(prev => ({ ...prev, name: e.target.value }))} />
          : <p className='mt-4 text-2xl font-medium sm:text-3xl text-neutral-800'>{userData.name}</p>
      }

      <hr className='bg-zinc-400 h-[1px] border-none' />
      <div>
        <p className='mt-3 underline text-neutral-500'>CONTACT INFORMATION</p>
        <div className='grid grid-cols-1 sm:grid-cols-[1fr_3fr] gap-y-1 sm:gap-y-2.5 mt-3 text-neutral-700'>
          <p className='mt-2 font-medium sm:mt-0'>Email id:</p>
          <p className='text-blue-500 break-all'>{userData.email}</p>
          <p className='mt-2 font-medium sm:mt-0'>NIC:</p>
          <p className='text-gray-500'>{userData.nic}</p>
          <p className='mt-2 font-medium sm:mt-0'>Phone:</p>
          {
            isEdit
              ? <input className='w-full bg-gray-100 sm:max-w-52' type="text" value={userData.phoneNumber} onChange={e => setUserData(prev => ({ ...prev, phoneNumber: e.target.value }))} />
              : <p className='text-blue-500'>{userData.phoneNumber}</p>
          }
          <p className='mt-2 font-medium sm:mt-0'>Address</p>
          {
            isEdit
              ? <p>
                <input className='w-full mb-1 bg-gray-100' onChange={(e) => setUserData(prev => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))} value={userData.address.line1} type="text" />
                <br />
                <input className='w-full bg-gray-100' onChange={(e) => setUserData(prev => ({ ...prev, address: { ...prev.address, line2: e.target.value } }))} value={userData.address.line2} type="text" />
              </p>
              : <p className='text-gray-500'>
                {userData.address.line1} <br />
                {userData.address.line2}
              </p>
          }
        </div>
      </div>
      <div>
        <p className='mt-3 underline text-neutral-500'>BASIC INFORMATION</p>
        <div className='grid grid-cols-1 sm:grid-cols-[1fr_3fr] gap-y-1 sm:gap-y-2.5 mt-3 text-neutral-700'>
          <p className='mt-2 font-medium sm:mt-0'>Gender</p>
          {
            isEdit
              ? <select className='bg-gray-100 max-w-28 sm:max-w-20' onChange={(e) => setUserData(prev => ({ ...prev, gender: e.target.value }))} value={userData.gender}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              : <p className='text-gray-400'>{userData.gender}</p>
          }
          <p className='mt-2 font-medium sm:mt-0'>Birthday:</p>
          {
            isEdit
              ? <input className='bg-gray-100 max-w-40 sm:max-w-28' type="date" max={new Date().toISOString().split('T')[0]} min={new Date(new Date().setFullYear(new Date().getFullYear() - 120)).toISOString().split('T')[0]} onChange={(e) => setUserData(prev => ({ ...prev, dob: e.target.value }))} value={userData.dob} />
              : <p className='text-gray-400'>{userData.dob}</p>
          }
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-3 mt-10'>
        {
          isEdit
            ? <>
              <button className='w-full px-8 py-2 transition-all border rounded-full sm:w-auto border-primary hover:bg-primary hover:text-white' onClick={updateUserProfileData}>Save information</button>
              <button className='px-4 py-2 transition-all text-neutral-500 hover:text-neutral-800' onClick={() => { setIsEdit(false); setImage(false) }}>Cancel</button>
            </>
            : <button className='w-full px-8 py-2 transition-all border rounded-full sm:w-auto border-primary hover:bg-primary hover:text-white' onClick={() => setIsEdit(true)}>Edit</button>
        }
      </div>

      <hr className='bg-zinc-400 h-[1px] border-none mt-6' />
      <div>
        {
          !showPasswordForm &&
          <button className='px-6 py-2 mt-3 text-sm transition-all border rounded-full border-primary text-primary hover:bg-primary hover:text-white' onClick={() => setShowPasswordForm(true)}>Change Password</button>
        }

        {
          showPasswordForm &&
          <div className='flex flex-col w-full gap-4 mt-4 sm:max-w-xs'>
            <div>
              <p className='mb-1 font-medium text-neutral-700'>Current Password</p>
              <input className='w-full px-3 py-2 transition-colors bg-gray-100 border border-transparent rounded outline-none focus:border-primary' type='password' value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete='current-password' />
            </div>
            <div>
              <p className='mb-1 font-medium text-neutral-700'>New Password</p>
              <input className='w-full px-3 py-2 transition-colors bg-gray-100 border border-transparent rounded outline-none focus:border-primary' type='password' value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete='new-password' />
            </div>
            <div>
              <p className='mb-1 font-medium text-neutral-700'>Confirm New Password</p>
              <input className='w-full px-3 py-2 transition-colors bg-gray-100 border border-transparent rounded outline-none focus:border-primary' type='password' value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete='new-password' />
            </div>
            <div className='flex flex-wrap items-center gap-3 mt-1'>
              <button
                className='w-full px-6 py-2 transition-all border rounded-full sm:w-auto border-primary hover:bg-primary hover:text-white disabled:opacity-50'
                disabled={savingPassword}
                onClick={handleChangePassword}
              >
                {savingPassword ? 'Saving...' : 'Update Password'}
              </button>
              <button className='px-2 py-2 transition-all text-neutral-500 hover:text-neutral-800' onClick={() => { setShowPasswordForm(false); resetPasswordForm() }}>Cancel</button>
            </div>
          </div>
        }
      </div>

    </div>
  )
}

export default MyProfile
