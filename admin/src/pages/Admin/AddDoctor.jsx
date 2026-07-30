import React, { useContext, useEffect, useState } from 'react'
import { assets, Hospitals } from '../../assets/assets'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const AddDoctor = () => {

  const [docImg, setDocImg] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [gender, setGender] = useState('Male')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [experience, setExperinece] = useState('1 Year')
  const [fees, setFees] = useState('')
  const [about, setAbout] = useState('')
  const [speciality, setSpeciality] = useState('')
  const [degree, setDegree] = useState('')
  const [governmentHospital, setGovernmentHospital] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')


  const { backendUrl, aToken, specialities, getSpecialities } = useContext(AdminContext)

  useEffect(() => {
    getSpecialities()
  }, [])

  useEffect(() => {
    if (!speciality && specialities.length > 0) {
      setSpeciality(specialities[0].speciality)
    }
  }, [specialities])

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    try {

      const trimmedName = name.trim()
      const allowedNameChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ "
      const isValidName = trimmedName.length > 0 && trimmedName.split('').every(ch => allowedNameChars.includes(ch))

      if (!isValidName) {
        return toast.error("Name should contain only letters and spaces")
      }

      if (trimmedName.length < 8 || trimmedName.length > 24) {
        return toast.error("Name must be between 8 and 24 characters")
      }

      if (Number(fees) < 0) {
        return toast.error("Fees cannot be negative");
      }

      if (Number(fees) > 20000) {
        return toast.error("Fees cannot exceed 20,000")
      }

      const formData = new FormData()

      if (docImg) {
        formData.append('image', docImg)
      }
      formData.append('name', name)
      formData.append('email', email)
      formData.append('password', password)
      formData.append('gender', gender)
      formData.append('registrationNumber', registrationNumber)
      formData.append('experience', experience)
      formData.append('fees', Number(fees))
      formData.append('about', about)
      formData.append('speciality', speciality)
      formData.append('degree', degree)
      formData.append('governmentHospital', governmentHospital)
      formData.append('address', JSON.stringify({ line1: address1, line2: address2 }))

      // console log formdata
      formData.forEach((value, key) => {
        console.log(`${key} : ${value}`)
      })

      const { data } = await axios.post(backendUrl + '/api/admin/add-doctor', formData, { headers: { aToken } })

      if (data.success) {
        toast.success(data.message)
        setDocImg(false)
        setName('')
        setPassword('')
        setEmail('')
        setGender('Male')
        setRegistrationNumber('')
        setAddress1('')
        setAddress2('')
        setDegree('')
        setGovernmentHospital('')
        setAbout('')
        setFees('')
        setExperinece('1 Year')
        setSpeciality(specialities[0]?.speciality || '')


      } else {
        toast.error(data.message)
      }

    } catch (error) {
      toast.error(error)
      console.log(error)

    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='w-full m-5'>

      <p className='mb-3 text-lg font-medium'>Add Doctor</p>

      <div className='bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[80vh] overflow-y-scroll'>
        <div className='flex items-center gap-4 mb-8 text-gray-500'>
          <label htmlFor="doc-img">
            <img className='w-16 bg-gray-100 rounded-full cursor-pointer' src={docImg ? URL.createObjectURL(docImg) : assets.upload_area} alt="" />
          </label>
          <input onChange={(e) => setDocImg(e.target.files[0])} type="file" id="doc-img" hidden />
          <p>Upload doctor <br /> picture</p>
        </div>

        <div className='flex flex-col items-start gap-10 text-gray-600 lg:flex-row'>
          <div className='flex flex-col w-full gap-4 lg:flex-1'>

            <div className='flex flex-col flex-1 gap-1'>
              <p>Doctor Name</p>
              <input onChange={(e) => setName(e.target.value)} value={name} className='px-3 py-2 border rounded' type="text" placeholder='Name' minLength={8} maxLength={24} required />
            </div>

            <div className='flex flex-col flex-1 gap-1'>
              <p>Doctor Email</p>
              <input onChange={(e) => setEmail(e.target.value)} value={email} className='px-3 py-2 border rounded' type="email" placeholder='Email' required />
            </div>

            <div className='flex flex-col flex-1 gap-1'>
              <p>Doctor Password</p>
              <input onChange={(e) => setPassword(e.target.value)} value={password} className='px-3 py-2 border rounded' type="password" placeholder='Password' required />
            </div>

            <div className='flex flex-col flex-1 gap-1'>
              <p>Gender</p>
              <select onChange={(e) => setGender(e.target.value)} value={gender} className='px-3 py-2 border rounded'>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className='flex flex-col flex-1 gap-1'>
              <p>Experience</p>
              <select onChange={(e) => setExperinece(e.target.value)} value={experience} className='px-3 py-2 border rounded' name="" id="">
                <option value={"1 Year"}>1 Year</option>
                <option value={"2 Year"}>2 Year</option>
                <option value={"3 Year"}>3 Year</option>
                <option value={"4 Year"}>4 Year</option>
                <option value={"5 Year"}>5 Year</option>
                <option value={"6 Year"}>6 Year</option>
                <option value={"7 Year"}>7 Year</option>
                <option value={"8 Year"}>8 Year</option>
                <option value={"9 Year"}>9 Year</option>
                <option value={"10 Year"}>10 Year</option>
              </select>
            </div>

            <div className='flex flex-col flex-1 gap-1'>
              <p>Fees</p>
              <input onChange={(e) => setFees(e.target.value)} value={fees} className='px-3 py-2 border rounded' type="number" placeholder='fees' min={0} max={20000} required />
            </div>

          </div>

          <div className='flex flex-col w-full gap-4 lg:flex-1'>

            <div className='flex flex-col flex-1 gap-1'>
              <p>Speciality</p>
              <select onChange={(e) => setSpeciality(e.target.value)} value={speciality} className='px-3 py-2 border rounded'>
                {specialities.map(item => (
                  <option key={item._id} value={item.speciality}>{item.speciality}</option>
                ))}
              </select>
            </div>

            <div className='flex flex-col flex-1 gap-1'>
              <p>Qualification</p>
              <input onChange={(e) => setDegree(e.target.value)} value={degree} className='px-3 py-2 border rounded' type="text" placeholder='Qualification' required />
            </div>

            <div className='flex flex-col flex-1 gap-1'>
              <p>Registration Number</p>
              <input onChange={(e) => setRegistrationNumber(e.target.value)} value={registrationNumber} className='px-3 py-2 border rounded' type="text" placeholder='Registration Number' required />
            </div>

            <div className='flex flex-col flex-1 gap-1'>
              <p>Practising Government Hospital (Optional)</p>
              <select onChange={(e) => setGovernmentHospital(e.target.value)} value={governmentHospital} className='px-3 py-2 border rounded'>
                <option value="">Not Applicable</option>
                {Hospitals.map(hospital => (
                  <option key={hospital} value={hospital}>{hospital}</option>
                ))}
              </select>
            </div>

            <div className='flex flex-col flex-1 gap-1'>
              <p>Address</p>
              <input onChange={(e) => setAddress1(e.target.value)} value={address1} className='px-3 py-2 border rounded' type="text" placeholder='address 1' required />
              <input onChange={(e) => setAddress2(e.target.value)} value={address2} className='px-3 py-2 border rounded' type="text" placeholder='address 2' required />
            </div>

          </div>
        </div>

        <div>
          <p className='mt-4 mb-2'>About Doctor</p>
          <textarea onChange={(e) => setAbout(e.target.value)} value={about} className='w-full px-4 pt-2 border rounded' placeholder='Write about doctor' rows={5} />
        </div>

        <button type='submit' className='bg-[#64748B] px-10 py-3 mt-4 text-white rounded-full'>Add doctor</button>

      </div>
    </form>
  )
}

export default AddDoctor
