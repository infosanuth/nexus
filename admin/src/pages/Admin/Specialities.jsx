import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'
import axios from 'axios'
import { Pencil, Plus, X, Stethoscope } from 'lucide-react'

const Specialities = () => {
  const { specialities, getSpecialities, aToken, backendUrl } = useContext(AdminContext)

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [fee, setFee] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)

  const [editId, setEditId] = useState(null)
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
        handleCancel()
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
    setEditId(item._id)
    setEditName(item.speciality)
    setEditFee(item.channelingFee)
    setEditImage(null)
    setEditImagePreview(`${backendUrl}${item.image}`)
  }

  const closeEdit = () => {
    setEditId(null)
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

  const handleEditSubmit = async (e, id) => {
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
        backendUrl + `/api/admin/update-speciality/${id}`,
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
    <div className='m-5'>

      {/* Header */}
      <div className='flex flex-wrap items-center justify-between gap-3 mb-6'>
        <p className='text-lg font-medium'>
          All Specialities <span className='text-sm font-normal text-gray-400'>({specialities.length})</span>
        </p>
        <button
          onClick={() => setShowForm(true)}
          className='inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white transition-all bg-indigo-500 rounded-lg hover:bg-indigo-600'
        >
          <Plus size={16} />
          Add Speciality
        </button>
      </div>

      {/* Add Speciality Form */}
      {showForm
        ? (
          <form
            onSubmit={handleSubmit}
            className='relative w-full max-w-md p-6 bg-white border border-gray-100 shadow-sm rounded-2xl'
          >
            <button
              type='button'
              onClick={handleCancel}
              className='absolute p-1 text-gray-400 rounded-full top-4 right-4 hover:text-gray-600 hover:bg-gray-100'
            >
              <X size={18} />
            </button>

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
        )
        : specialities.length > 0
        ? (
          <div
            className='grid gap-x-5 gap-y-8'
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}
          >
            {specialities.map((item, index) => {
              const isEditing = editId === item._id

              if (isEditing) {
                return (
                  <form
                    key={index}
                    onSubmit={(e) => handleEditSubmit(e, item._id)}
                    className='flex flex-col items-center justify-start gap-2 p-5 text-center bg-white border-2 border-indigo-200 rounded-2xl min-h-[220px]'
                  >
                    <label className='relative cursor-pointer group'>
                      <div className='flex items-center justify-center w-20 h-20 overflow-hidden rounded-full'>
                        <img src={editImagePreview} alt='preview' className='object-contain w-full h-full' />
                      </div>
                      <div className='absolute inset-0 flex items-center justify-center transition-opacity rounded-full opacity-0 bg-black/40 group-hover:opacity-100'>
                        <Pencil size={16} className='text-white' />
                      </div>
                      <input type='file' accept='image/*' onChange={handleEditImageChange} className='hidden' />
                    </label>

                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      type='text'
                      placeholder='Speciality name'
                      className='w-full px-2 py-1 mt-4 text-sm font-semibold text-center text-gray-800 border border-gray-300 rounded outline-none focus:border-indigo-400'
                    />
                    <div className='flex items-center w-full overflow-hidden border border-indigo-100 rounded bg-indigo-50 focus-within:border-indigo-400'>
                      <span className='pl-3 text-xs font-medium text-indigo-600 select-none'>Rs</span>
                      <input
                        value={editFee}
                        onChange={e => setEditFee(e.target.value)}
                        type='number'
                        min='0'
                        placeholder='Fee'
                        className='flex-1 min-w-0 py-1 pl-1 pr-2 text-xs text-center bg-transparent border-none outline-none'
                      />
                    </div>

                    <div className='flex gap-2 mt-2'>
                      <button
                        type='submit'
                        disabled={editLoading}
                        className='px-3 py-1.5 text-xs font-medium text-white transition-all bg-indigo-500 rounded-lg hover:bg-indigo-600 disabled:opacity-60'
                      >
                        {editLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type='button'
                        onClick={closeEdit}
                        className='px-3 py-1.5 text-xs font-medium text-gray-600 transition-all border border-gray-300 rounded-lg hover:bg-gray-100'
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )
              }

              return (
                <div
                  key={index}
                  className='flex flex-col items-center justify-between gap-2 p-5 text-center transition-all duration-300 bg-white border border-gray-100 rounded-2xl min-h-[220px] hover:-translate-y-1 hover:shadow-lg'
                >
                  <div
                    className='relative cursor-pointer group'
                    onClick={() => openEdit(item)}
                  >
                    <div className='flex items-center justify-center w-20 h-20 overflow-hidden rounded-full'>
                      <img
                        className='object-contain w-full h-full'
                        src={`${backendUrl}${item.image}`}
                        alt={item.speciality}
                      />
                    </div>
                    <div className='absolute inset-0 flex items-center justify-center transition-opacity rounded-full opacity-0 bg-black/40 group-hover:opacity-100'>
                      <Pencil size={16} className='text-white' />
                    </div>
                  </div>
                  <div className='flex flex-col items-center gap-2'>
                    <p className='text-sm font-semibold leading-snug text-gray-800'>{item.speciality}</p>
                    <span className='px-3 py-1 text-xs font-medium text-indigo-600 border border-indigo-100 rounded-full bg-indigo-50'>
                      Rs {item.channelingFee.toLocaleString()}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )
        : (
          <div className='flex flex-col items-center justify-center gap-3 py-20 text-center bg-white border border-gray-100 border-dashed rounded-2xl'>
            <div className='flex items-center justify-center rounded-full w-14 h-14 bg-indigo-50'>
              <Stethoscope size={24} className='text-indigo-400' />
            </div>
            <p className='text-sm text-gray-500'>No specialities found.</p>
            <button
              onClick={() => setShowForm(true)}
              className='inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white transition-all bg-indigo-500 rounded-lg hover:bg-indigo-600'
            >
              <Plus size={16} />
              Add Speciality
            </button>
          </div>
        )
      }

    </div>
  )
}

export default Specialities
