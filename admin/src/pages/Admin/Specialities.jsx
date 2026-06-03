import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'
import axios from 'axios'
import { Pencil } from 'lucide-react'

const Specialities = () => {
  const { specialities, getSpecialities, aToken, backendUrl } = useContext(AdminContext)

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [fee, setFee] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const [editTarget, setEditTarget] = useState(null)
  const [editName, setEditName] = useState('')
  const [editFee, setEditFee] = useState('')
  const [editImage, setEditImage] = useState(null)
  const [editImagePreview, setEditImagePreview] = useState(null)
  const [editLoading, setEditLoading] = useState(false)

  useEffect(() => {
    getSpecialities()
  }, [])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !fee || !image) {
      toast.error('All fields including image are required')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('speciality', name)
      formData.append('channelingFee', fee)
      formData.append('image', image)
      const { data } = await axios.post(backendUrl + '/api/admin/add-speciality', formData, { headers: { aToken } })
      if (data.success) {
        toast.success(data.message || 'Speciality added successfully')
        setName('')
        setFee('')
        setImage(null)
        setImagePreview(null)
        setShowForm(false)
        getSpecialities()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setName('')
    setFee('')
    setImage(null)
    setImagePreview(null)
  }

  const openEdit = (item) => {
    setEditTarget(item)
    setEditName(item.speciality)
    setEditFee(item.channelingFee)
    setEditImage(null)
    setEditImagePreview(`${backendUrl}${item.image}`)
  }

  const closeEdit = () => {
    setEditTarget(null)
    setEditName('')
    setEditFee('')
    setEditImage(null)
    setEditImagePreview(null)
  }

  const handleEditImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setEditImage(file)
      setEditImagePreview(URL.createObjectURL(file))
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editName || !editFee) {
      toast.error('Name and fee are required')
      return
    }
    setEditLoading(true)
    try {
      const formData = new FormData()
      formData.append('speciality', editName)
      formData.append('channelingFee', editFee)
      if (editImage) formData.append('image', editImage)

      const { data } = await axios.put(
        backendUrl + `/api/admin/update-speciality/${editTarget._id}`,
        formData,
        { headers: { aToken } }
      )
      if (data.success) {
        toast.success(data.message || 'Speciality updated successfully')
        closeEdit()
        getSpecialities()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <div className='w-full m-5'>

      {/* Header */}
      <div className='flex items-center justify-between mb-5'>
        <h1 className='text-lg font-medium'>All Specialities</h1>
        <button
          onClick={() => setShowForm(prev => !prev)}
          className='px-4 py-2 text-sm text-white transition-all bg-indigo-500 rounded hover:bg-indigo-600'
        >
          {showForm ? 'Cancel' : '+ Add Speciality'}
        </button>
      </div>

      {/* Add Speciality Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className='max-w-md p-6 mb-6 bg-white border border-indigo-100 shadow-sm rounded-xl'
        >
          <h2 className='mb-4 text-base font-medium text-neutral-700'>New Speciality</h2>

          <div className='mb-4'>
            <p className='mb-2 text-sm text-gray-600'>Speciality Image</p>
            <label className='inline-block cursor-pointer'>
              <div className='flex items-center justify-center w-24 h-24 overflow-hidden transition-all border-2 border-gray-300 border-dashed rounded-xl hover:border-indigo-400 bg-gray-50'>
                {imagePreview
                  ? <img src={imagePreview} alt="preview" className='object-cover w-full h-full' />
                  : <span className='text-3xl text-gray-300'>+</span>
                }
              </div>
              <input type='file' accept='image/*' onChange={handleImageChange} className='hidden' />
            </label>
          </div>

          <div className='mb-3'>
            <label className='block mb-1 text-sm text-gray-600'>Speciality Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              type='text'
              placeholder='e.g. Cardiology'
              className='w-full px-3 py-2 text-sm transition-colors border border-gray-300 rounded outline-none focus:border-indigo-400'
            />
          </div>

          <div className='mb-5'>
            <label className='block mb-1 text-sm text-gray-600'>Channeling Fee (Rs)</label>
            <input
              value={fee}
              onChange={e => setFee(e.target.value)}
              type='number'
              min='0'
              placeholder='e.g. 1500'
              className='w-full px-3 py-2 text-sm transition-colors border border-gray-300 rounded outline-none focus:border-indigo-400'
            />
          </div>

          <div className='flex gap-3'>
            <button
              type='submit'
              disabled={loading}
              className='px-5 py-2 text-sm text-white transition-all bg-indigo-500 rounded hover:bg-indigo-600 disabled:opacity-60'
            >
              {loading ? 'Adding...' : 'Add Speciality'}
            </button>
            <button
              type='button'
              onClick={handleCancel}
              className='px-5 py-2 text-sm text-gray-600 transition-all border border-gray-300 rounded hover:bg-gray-100'
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Specialities Grid */}
      <div className={`flex flex-wrap gap-5 ${showForm ? 'hidden' : ''}`}>
        {specialities.length > 0
          ? specialities.map((item, index) => (
            <div
              key={index}
              className='bg-white rounded-2xl shadow-md w-52 overflow-hidden border border-gray-100 hover:shadow-xl hover:translate-y-[-6px] transition-all duration-300'
            >
              {/* Content area */}
              <div className='flex flex-col items-center px-4 pt-8 pb-7'>
                <img
                  className='object-contain w-20 h-20 mb-3'
                  src={`${backendUrl}${item.image}`}
                  alt={item.speciality}
                />
                <p className='text-sm font-semibold leading-snug text-center text-gray-800'>{item.speciality}</p>
                <span className='px-3 py-1 mt-2 text-xs font-medium text-indigo-600 border border-indigo-100 rounded-full bg-indigo-50'>
                  Rs {item.channelingFee.toLocaleString()}
                </span>
                <button
                  onClick={() => openEdit(item)}
                  className='mt-4 w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 rounded-xl transition-colors'
                >
                  <Pencil size={13} />
                  Edit
                </button>
              </div>
            </div>
          ))
          : <p className='text-sm text-gray-400'>No specialities found.</p>
        }
      </div>

      {/* Edit Modal */}
      {editTarget && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
          <form
            onSubmit={handleEditSubmit}
            className='bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6'
          >
            <h2 className='mb-4 text-base font-medium text-neutral-700'>Edit Speciality</h2>

            <div className='mb-4'>
              <p className='mb-2 text-sm text-gray-600'>Speciality Image</p>
              <label className='inline-block cursor-pointer'>
                <div className='flex items-center justify-center w-24 h-24 overflow-hidden transition-all border-2 border-gray-300 border-dashed rounded-xl hover:border-indigo-400 bg-gray-50'>
                  {editImagePreview
                    ? <img src={editImagePreview} alt="preview" className='object-cover w-full h-full' />
                    : <span className='text-3xl text-gray-300'>+</span>
                  }
                </div>
                <input type='file' accept='image/*' onChange={handleEditImageChange} className='hidden' />
              </label>
            </div>

            <div className='mb-3'>
              <label className='block mb-1 text-sm text-gray-600'>Speciality Name</label>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                type='text'
                className='w-full px-3 py-2 text-sm transition-colors border border-gray-300 rounded outline-none focus:border-indigo-400'
              />
            </div>

            <div className='mb-5'>
              <label className='block mb-1 text-sm text-gray-600'>Channeling Fee (Rs)</label>
              <input
                value={editFee}
                onChange={e => setEditFee(e.target.value)}
                type='number'
                min='0'
                className='w-full px-3 py-2 text-sm transition-colors border border-gray-300 rounded outline-none focus:border-indigo-400'
              />
            </div>

            <div className='flex gap-3'>
              <button
                type='submit'
                disabled={editLoading}
                className='px-5 py-2 text-sm text-white transition-all bg-indigo-500 rounded hover:bg-indigo-600 disabled:opacity-60'
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type='button'
                onClick={closeEdit}
                className='px-5 py-2 text-sm text-gray-600 transition-all border border-gray-300 rounded hover:bg-gray-100'
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}

export default Specialities
