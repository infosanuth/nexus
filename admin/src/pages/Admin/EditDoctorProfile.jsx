import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AdminContext } from '../../context/AdminContext'
import { assets, Hospitals } from '../../assets/assets'

const EditDoctorProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { backendUrl, aToken, specialities, getSpecialities } = useContext(AdminContext)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [docImg, setDocImg] = useState(null)
  const [currentImage, setCurrentImage] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [gender, setGender] = useState('Male')
  const [experience, setExperience] = useState('1 Year')
  const [fees, setFees] = useState('')
  const [about, setAbout] = useState('')
  const [speciality, setSpeciality] = useState('')
  const [degree, setDegree] = useState('')
  const [governmentHospital, setGovernmentHospital] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')

  useEffect(() => {
    if (aToken && specialities.length === 0) getSpecialities()
  }, [aToken])

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/admin/doctor/${id}`, { headers: { aToken } })
        if (data.success) {
          const d = data.doctor
          setCurrentImage(d.image || '')
          setName(d.name || '')
          setEmail(d.email || '')
          setRegistrationNumber(d.registrationNumber || '')
          setGender(d.gender || 'Male')
          setExperience(d.experience || '1 Year')
          setFees(d.fees || '')
          setAbout(d.about || '')
          setSpeciality(d.speciality || '')
          setDegree(d.degree || '')
          setGovernmentHospital(d.governmentHospital || '')
          setAddress1(d.address?.line1 || '')
          setAddress2(d.address?.line2 || '')
        } else {
          toast.error(data.message)
          navigate('/doctor-list')
        }
      } catch (error) {
        toast.error(error.message)
        navigate('/doctor-list')
      } finally {
        setLoading(false)
      }
    }

    if (aToken && id) fetchDoctor()
  }, [aToken, id])

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    if (Number(fees) < 0) return toast.error('Fees cannot be negative')

    setSubmitting(true)
    try {
      const formData = new FormData()
      if (docImg) formData.append('image', docImg)
      formData.append('name', name)
      formData.append('email', email)
      formData.append('registrationNumber', registrationNumber)
      formData.append('gender', gender)
      formData.append('experience', experience)
      formData.append('fees', Number(fees))
      formData.append('about', about)
      formData.append('speciality', speciality)
      formData.append('degree', degree)
      formData.append('governmentHospital', governmentHospital)
      formData.append('address', JSON.stringify({ line1: address1, line2: address2 }))

      const { data } = await axios.put(`${backendUrl}/api/admin/update-doctor/${id}`, formData, { headers: { aToken } })

      if (data.success) {
        toast.success(data.message)
        navigate('/doctor-list')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const imagePreview = docImg
    ? URL.createObjectURL(docImg)
    : currentImage
    ? `${backendUrl}${currentImage}`
    : assets.upload_area

  if (loading) {
    return (
      <div className='flex items-center justify-center flex-1 w-full h-64'>
        <p className='text-sm text-gray-400'>Loading doctor profile...</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex-1 w-full m-5'>
      <div className='flex items-center gap-3 mb-4'>
        <button
          type='button'
          onClick={() => navigate('/doctor-list')}
          className='text-sm text-gray-500 hover:text-gray-800'
        >
          ← Doctor List
        </button>
        <span className='text-gray-300'>/</span>
        <p className='text-lg font-medium'>Edit Doctor Profile</p>
      </div>

      <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll'>

        {/* Image upload */}
        <div className='flex items-center gap-4 mb-8 text-gray-500'>
          <label htmlFor='doc-img' className='cursor-pointer'>
            <img
              src={imagePreview}
              alt='Doctor'
              className='object-cover w-16 h-16 rounded-full bg-gray-100 ring-2 ring-blue-50'
            />
          </label>
          <input onChange={(e) => setDocImg(e.target.files[0])} type='file' id='doc-img' accept='image/*' hidden />
          <div>
            <p className='text-sm font-medium text-gray-700'>Profile Photo</p>
            <p className='text-xs text-gray-400'>Click the photo to upload a new one</p>
          </div>
        </div>

        <div className='flex flex-col lg:flex-row items-start gap-10 text-gray-600'>

          {/* Left column */}
          <div className='w-full lg:flex-1 flex flex-col gap-4'>

            <div className='flex flex-col gap-1'>
              <p>Email</p>
              <input onChange={(e) => setEmail(e.target.value)} value={email} className='border rounded px-3 py-2' type='email' placeholder='Email' required />
            </div>

            <div className='flex flex-col gap-1'>
              <p>Doctor Name</p>
              <input onChange={(e) => setName(e.target.value)} value={name} className='border rounded px-3 py-2' type='text' placeholder='Name' required />
            </div>

            <div className='flex flex-col gap-1'>
              <p>Gender</p>
              <select onChange={(e) => setGender(e.target.value)} value={gender} className='border rounded px-3 py-2'>
                <option value='Male'>Male</option>
                <option value='Female'>Female</option>
              </select>
            </div>

            <div className='flex flex-col gap-1'>
              <p>Experience</p>
              <select onChange={(e) => setExperience(e.target.value)} value={experience} className='border rounded px-3 py-2'>
                {['1 Year','2 Year','3 Year','4 Year','5 Year','6 Year','7 Year','8 Year','9 Year','10 Year'].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div className='flex flex-col gap-1'>
              <p>Fees</p>
              <input onChange={(e) => setFees(e.target.value)} value={fees} className='border rounded px-3 py-2' type='number' placeholder='Fees' required />
            </div>

          </div>

          {/* Right column */}
          <div className='w-full lg:flex-1 flex flex-col gap-4'>

            <div className='flex flex-col gap-1'>
              <p>Registration Number</p>
              <input onChange={(e) => setRegistrationNumber(e.target.value)} value={registrationNumber} className='border rounded px-3 py-2' type='text' placeholder='Registration Number' required />
            </div>

            <div className='flex flex-col gap-1'>
              <p>Speciality</p>
              <select onChange={(e) => setSpeciality(e.target.value)} value={speciality} className='border rounded px-3 py-2'>
                {specialities.length > 0
                  ? specialities.map(s => <option key={s._id} value={s.speciality}>{s.speciality}</option>)
                  : ['General physician','Gynecologist','Dermatologist','Pediatricians','Neurologist','Gastroenterologist'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))
                }
              </select>
            </div>

            <div className='flex flex-col gap-1'>
              <p>Qualification</p>
              <input onChange={(e) => setDegree(e.target.value)} value={degree} className='border rounded px-3 py-2' type='text' placeholder='Qualification' required />
            </div>

            <div className='flex flex-col gap-1'>
              <p>Practising Government Hospital (Optional)</p>
              <select onChange={(e) => setGovernmentHospital(e.target.value)} value={governmentHospital} className='border rounded px-3 py-2'>
                <option value=''>Not Applicable</option>
                {Hospitals.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>

            <div className='flex flex-col gap-1'>
              <p>Address</p>
              <input onChange={(e) => setAddress1(e.target.value)} value={address1} className='border rounded px-3 py-2' type='text' placeholder='Address line 1' required />
              <input onChange={(e) => setAddress2(e.target.value)} value={address2} className='border rounded px-3 py-2' type='text' placeholder='Address line 2' />
            </div>

          </div>
        </div>

        <div className='mt-4'>
          <p className='mb-2'>About Doctor</p>
          <textarea onChange={(e) => setAbout(e.target.value)} value={about} className='w-full px-4 pt-2 border rounded' placeholder='Write about doctor' rows={5} />
        </div>

        <div className='flex items-center gap-3 mt-4'>
          <button
            type='submit'
            disabled={submitting}
            className='bg-[#64748B] px-10 py-3 text-white rounded-full disabled:opacity-60'
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type='button'
            onClick={() => navigate('/doctor-list')}
            className='px-6 py-3 text-sm text-gray-500 hover:text-gray-800'
          >
            Cancel
          </button>
        </div>

      </div>
    </form>
  )
}

export default EditDoctorProfile
