import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'

const AdminProfile = () => {

  const { aToken, myProfile, getMyProfile, updateMyProfile, changeMyPassword } = useContext(AdminContext)

  const [isEdit, setIsEdit] = useState(false)
  const [name, setName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (aToken) getMyProfile()
  }, [aToken])

  useEffect(() => {
    if (myProfile) {
      setName(myProfile.name || '')
    }
  }, [myProfile])

  const handleCancel = () => {
    if (myProfile) {
      setName(myProfile.name || '')
    }
    setIsEdit(false)
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    const success = await updateMyProfile(name)
    setSavingProfile(false)
    if (success) setIsEdit(false)
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match')
      return
    }
    setSavingPassword(true)
    const success = await changeMyPassword(currentPassword, newPassword)
    setSavingPassword(false)
    if (success) {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  if (!myProfile) return null

  return (
    <div className='flex flex-col w-full max-w-2xl gap-6 m-5'>

      {/* Avatar + name header */}
      <div className='flex items-center gap-5'>
        <div className='flex items-center justify-center text-2xl font-semibold text-white rounded-full w-20 h-20 bg-primary'>
          {(myProfile.name || 'A').charAt(0).toUpperCase()}
        </div>
        <div>
          <p className='text-2xl font-semibold text-gray-800'>{myProfile.name}</p>
          <p className='text-sm text-gray-500'>Admin</p>
        </div>
      </div>

      {myProfile.isSuperAdmin && (
        <p className='px-4 py-3 text-sm border rounded-lg text-amber-700 bg-amber-50 border-amber-200'>
          This default admin account is configured via environment settings, so its name, email and password can't be edited here.
        </p>
      )}

      {/* Profile card */}
      <div className='p-8 bg-white border border-stone-100 rounded-xl'>
        <p className='mb-5 text-sm font-semibold text-gray-800'>Profile</p>

        <div className='flex flex-col gap-6 lg:flex-row'>
          <div className='flex flex-col flex-1 gap-1'>
            <p className='text-sm text-gray-600'>Name</p>
            {isEdit
              ? <input value={name} onChange={(e) => setName(e.target.value)} className='px-3 py-2 text-sm border rounded' type='text' required />
              : <p className='text-sm text-gray-800'>{myProfile.name}</p>}
          </div>
          <div className='flex flex-col flex-1 gap-1'>
            <p className='text-sm text-gray-600'>Email</p>
            <p className='text-sm text-gray-800'>{myProfile.email}</p>
          </div>
        </div>

        {!myProfile.isSuperAdmin && (
          <div className='flex items-center gap-3 mt-6'>
            {isEdit ? (
              <>
                <button onClick={handleSaveProfile} disabled={savingProfile} className='px-6 py-2 text-sm text-white bg-[#64748B] rounded-full hover:bg-[#4f5f6e] disabled:opacity-60'>
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
                <button onClick={handleCancel} className='px-5 py-2 text-sm text-gray-500 hover:text-gray-800'>
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setIsEdit(true)} className='px-6 py-2 text-sm border border-[#64748B] text-[#64748B] rounded-full hover:bg-[#64748B] hover:text-white transition-all'>
                Edit Profile
              </button>
            )}
          </div>
        )}
      </div>

      {/* Change password card */}
      {!myProfile.isSuperAdmin && (
        <div className='p-8 bg-white border border-stone-100 rounded-xl'>
          <p className='mb-5 text-sm font-semibold text-gray-800'>Change Password</p>

          <div className='flex flex-col gap-4 max-w-sm'>
            <div className='flex flex-col gap-1'>
              <p className='text-sm text-gray-600'>Current Password</p>
              <input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className='px-3 py-2 text-sm border rounded' type='password' />
            </div>
            <div className='flex flex-col gap-1'>
              <p className='text-sm text-gray-600'>New Password</p>
              <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className='px-3 py-2 text-sm border rounded' type='password' />
            </div>
            <div className='flex flex-col gap-1'>
              <p className='text-sm text-gray-600'>Confirm New Password</p>
              <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className='px-3 py-2 text-sm border rounded' type='password' />
            </div>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
            className='px-6 py-2 mt-6 text-sm text-white bg-[#64748B] rounded-full hover:bg-[#4f5f6e] disabled:opacity-60'
          >
            {savingPassword ? 'Saving...' : 'Update Password'}
          </button>
        </div>
      )}

    </div>
  )
}

export default AdminProfile
