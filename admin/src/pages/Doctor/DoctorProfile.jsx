import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { assets, Hospitals } from '../../assets/assets'
import { toast } from 'react-toastify'
import axios from 'axios'

const DoctorProfile = () => {

  const { dToken, profileData, setProfileData, getProfileData, backendUrl } = useContext(DoctorContext)

  const [isEdit, setIsEdit] = useState(false)
  const [docImg, setDocImg] = useState(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [experience, setExperience] = useState('')
  const [governmentHospital, setGovernmentHospital] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [about, setAbout] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (dToken) getProfileData()
  }, [dToken])

  useEffect(() => {
    if (profileData) {
      setName(profileData.name || '')
      setEmail(profileData.email || '')
      setExperience(profileData.experience || '1 Year')
      setGovernmentHospital(profileData.governmentHospital || '')
      setAddress1(profileData.address?.line1 || '')
      setAddress2(profileData.address?.line2 || '')
      setAbout(profileData.about || '')
    }
  }, [profileData])

  const handleCancel = () => {
    if (profileData) {
      setName(profileData.name || '')
      setEmail(profileData.email || '')
      setExperience(profileData.experience || '1 Year')
      setGovernmentHospital(profileData.governmentHospital || '')
      setAddress1(profileData.address?.line1 || '')
      setAddress2(profileData.address?.line2 || '')
      setAbout(profileData.about || '')
      setDocImg(null)
    }
    setIsEdit(false)
  }

  const updateProfile = async () => {
    setSubmitting(true)
    try {
      const formData = new FormData()
      if (docImg) formData.append('image', docImg)
      formData.append('name', name)
      formData.append('email', email)
      formData.append('experience', experience)
      formData.append('governmentHospital', governmentHospital)
      formData.append('address', JSON.stringify({ line1: address1, line2: address2 }))
      formData.append('about', about)
      formData.append('available', profileData.available)

      const { data } = await axios.post(backendUrl + '/api/doctor/update-profile', formData, { headers: { dToken } })

      if (data.success) {
        toast.success(data.message)
        setDocImg(null)
        setIsEdit(false)
        getProfileData()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
      console.log(error)
    } finally {
      setSubmitting(false)
    }
  }

  const imagePreview = docImg
    ? URL.createObjectURL(docImg)
    : profileData?.image
    ? `${backendUrl}${profileData.image}`
    : assets.default_doctor

  if (!profileData) return null

  return (
    <div className='flex flex-col gap-6 m-5'>

      {/* Avatar + name header */}
      <div className='flex items-center gap-5'>
        <div className='relative'>
          <img
            src={imagePreview}
            alt={profileData.name}
            className='object-cover w-24 h-24 rounded-full ring-4 ring-blue-50 bg-blue-50'
          />
          {isEdit && (
            <label htmlFor='doc-img' className='absolute bottom-0 right-0 p-1.5 bg-white border border-gray-200 rounded-full shadow cursor-pointer hover:border-blue-300'>
              <img src={assets.upload_area} alt='' className='w-4 h-4' />
              <input onChange={(e) => setDocImg(e.target.files[0])} type='file' id='doc-img' accept='image/*' hidden />
            </label>
          )}
        </div>
        <div>
          <p className='text-2xl font-semibold text-gray-800'>{profileData.name}</p>
          <p className='text-sm text-gray-500'>{profileData.degree} · {profileData.speciality}</p>
          {profileData.registrationNumber && (
            <p className='mt-0.5 text-xs text-gray-400'>Reg. No: {profileData.registrationNumber}</p>
          )}
        </div>
      </div>

      <div className='bg-white border border-stone-100 rounded-xl p-8'>

        {/* Read-only fields */}
        <div className='flex flex-wrap gap-6 pb-6 mb-6 border-b border-gray-100'>
          <div>
            <p className='mb-1 text-xs font-medium text-gray-400'>Speciality</p>
            <p className='text-sm text-gray-700'>{profileData.speciality}</p>
          </div>
          <div>
            <p className='mb-1 text-xs font-medium text-gray-400'>Consultation Fee</p>
            <p className='text-sm text-gray-700'>LKR {profileData.fees}</p>
          </div>
          <div>
            <p className='mb-1 text-xs font-medium text-gray-400'>Gender</p>
            <p className={`text-sm font-medium ${profileData.gender === 'Female' ? 'text-pink-600' : 'text-blue-600'}`}>{profileData.gender}</p>
          </div>
          <div>
            <p className='mb-1 text-xs font-medium text-gray-400'>Registration Number</p>
            <p className='text-sm text-gray-700'>{profileData.registrationNumber}</p>
          </div>
        </div>

        {/* Editable fields */}
        <div className='flex flex-col gap-4 text-gray-600'>

          <div className='flex flex-col lg:flex-row gap-6'>
            <div className='flex flex-col gap-1 flex-1'>
              <p className='text-sm'>Name</p>
              {isEdit
                ? <input value={name} onChange={(e) => setName(e.target.value)} className='border rounded px-3 py-2 text-sm' type='text' required />
                : <p className='text-sm text-gray-800'>{profileData.name}</p>}
            </div>
            <div className='flex flex-col gap-1 flex-1'>
              <p className='text-sm'>Email</p>
              {isEdit
                ? <input value={email} onChange={(e) => setEmail(e.target.value)} className='border rounded px-3 py-2 text-sm' type='email' required />
                : <p className='text-sm text-gray-800'>{profileData.email}</p>}
            </div>
          </div>

          <div className='flex flex-col lg:flex-row gap-6'>
            <div className='flex flex-col gap-1 flex-1'>
              <p className='text-sm'>Experience</p>
              {isEdit
                ? <select value={experience} onChange={(e) => setExperience(e.target.value)} className='border rounded px-3 py-2 text-sm'>
                    {['1 Year','2 Year','3 Year','4 Year','5 Year','6 Year','7 Year','8 Year','9 Year','10 Year'].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                : <p className='text-sm text-gray-800'>{profileData.experience}</p>}
            </div>
            <div className='flex flex-col gap-1 flex-1'>
              <p className='text-sm'>Practising Government Hospital</p>
              {isEdit
                ? <select value={governmentHospital} onChange={(e) => setGovernmentHospital(e.target.value)} className='border rounded px-3 py-2 text-sm'>
                    <option value=''>Not Applicable</option>
                    {Hospitals.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                : <p className='text-sm text-gray-800'>{profileData.governmentHospital || 'Not Applicable'}</p>}
            </div>
          </div>

          <div className='flex flex-col gap-1'>
            <p className='text-sm'>Address</p>
            {isEdit ? (
              <div className='flex flex-col gap-2'>
                <input value={address1} onChange={(e) => setAddress1(e.target.value)} className='border rounded px-3 py-2 text-sm' type='text' placeholder='Address line 1' />
                <input value={address2} onChange={(e) => setAddress2(e.target.value)} className='border rounded px-3 py-2 text-sm' type='text' placeholder='Address line 2' />
              </div>
            ) : (
              <p className='text-sm text-gray-800'>{profileData.address?.line1}{profileData.address?.line2 ? `, ${profileData.address.line2}` : ''}</p>
            )}
          </div>

          <div className='flex flex-col gap-1'>
            <p className='text-sm'>About</p>
            {isEdit
              ? <textarea value={about} onChange={(e) => setAbout(e.target.value)} className='border rounded px-3 py-2 text-sm' rows={4} placeholder='Write about yourself' />
              : <p className='text-sm text-gray-800 max-w-2xl'>{profileData.about || '—'}</p>}
          </div>

          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={profileData.available}
              onChange={() => isEdit && setProfileData(prev => ({ ...prev, available: !prev.available }))}
              className='accent-blue-600'
            />
            <label className='text-sm'>Available</label>
          </div>

        </div>

        {/* Actions */}
        <div className='flex items-center gap-3 mt-6'>
          {isEdit ? (
            <>
              <button onClick={updateProfile} disabled={submitting} className='px-6 py-2 text-sm text-white bg-[#64748B] rounded-full hover:bg-[#4f5f6e] disabled:opacity-60'>
                {submitting ? 'Saving...' : 'Save Changes'}
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

      </div>
    </div>
  )
}

export default DoctorProfile
