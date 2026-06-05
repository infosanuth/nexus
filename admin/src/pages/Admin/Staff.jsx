import React, { useContext, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'
import axios from 'axios'
import { UserRoundPlus, Eye, EyeOff } from 'lucide-react'

const Staff = () => {
  const { aToken, backendUrl } = useContext(AdminContext)

  const [staff] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('receptionist')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const resetForm = () => {
    setName('')
    setEmail('')
    setPassword('')
    setRole('receptionist')
    setShowPassword(false)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await axios.post(
        backendUrl + '/api/admin/add-staff',
        { name, email, password, role },
        { headers: { aToken } }
      )
      if (data.success) {
        toast.success(data.message)
        resetForm()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='w-full m-5'>

      {/* Header */}
      <div className='flex items-center justify-between mb-5'>
        <h1 className='text-lg font-medium'>Staff</h1>
        <button
          onClick={() => setShowForm(true)}
          className='flex items-center gap-2 px-4 py-2 text-sm text-white transition-all bg-indigo-500 rounded hover:bg-indigo-600'
        >
          <UserRoundPlus size={16} />
          Add Staff
        </button>
      </div>

      {/* Staff Table */}
      <div className='overflow-hidden bg-white border rounded-xl'>
        <table className='w-full text-sm text-left'>
          <thead className='border-b bg-gray-50'>
            <tr>
              <th className='px-6 py-3 font-medium text-gray-500'>#</th>
              <th className='px-6 py-3 font-medium text-gray-500'>Name</th>
              <th className='px-6 py-3 font-medium text-gray-500'>Role</th>
              <th className='px-6 py-3 font-medium text-gray-500'>Active</th>
            </tr>
          </thead>
          <tbody>
            {staff.length > 0 ? (
              staff.map((member, index) => (
                <tr key={member._id} className='transition-colors border-b last:border-0 hover:bg-gray-50'>
                  <td className='px-6 py-4 text-gray-400'>{index + 1}</td>
                  <td className='px-6 py-4'>
                    <p className='font-medium text-gray-800'>{member.name}</p>
                    <p className='text-xs text-gray-400'>{member.email}</p>
                  </td>
                  <td className='px-6 py-4'>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      member.role === 'admin'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  </td>
                  <td className='px-6 py-4'>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      member.isActive
                        ? 'bg-green-50 text-green-600'
                        : 'bg-red-50 text-red-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className='px-6 py-12 text-sm text-center text-gray-400'>
                  No staff members found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {showForm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
          <form
            onSubmit={handleSubmit}
            className='w-full max-w-md p-6 mx-4 bg-white shadow-xl rounded-xl'
          >
            <h2 className='mb-5 text-base font-medium text-neutral-700'>Add Staff Member</h2>

            <div className='mb-3'>
              <label className='block mb-1 text-sm text-gray-600'>Full Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                type='text'
                placeholder='e.g. John Perera'
                required
                className='w-full px-3 py-2 text-sm transition-colors border border-gray-300 rounded outline-none focus:border-indigo-400'
              />
            </div>

            <div className='mb-3'>
              <label className='block mb-1 text-sm text-gray-600'>Email Address</label>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                type='email'
                placeholder='e.g. john@hospital.com'
                required
                className='w-full px-3 py-2 text-sm transition-colors border border-gray-300 rounded outline-none focus:border-indigo-400'
              />
            </div>

            <div className='mb-3'>
              <label className='block mb-1 text-sm text-gray-600'>Password</label>
              <div className='relative'>
                <input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Min. 8 characters'
                  required
                  minLength={8}
                  className='w-full px-3 py-2 pr-10 text-sm transition-colors border border-gray-300 rounded outline-none focus:border-indigo-400'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(p => !p)}
                  className='absolute inset-y-0 flex items-center text-gray-400 right-2 hover:text-gray-600'
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className='mb-5'>
              <label className='block mb-1 text-sm text-gray-600'>Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className='w-full px-3 py-2 text-sm transition-colors border border-gray-300 rounded outline-none focus:border-indigo-400'
              >
                <option value='receptionist'>Receptionist</option>
                <option value='admin'>Admin</option>
              </select>
            </div>

            <div className='flex gap-3'>
              <button
                type='submit'
                disabled={loading}
                className='px-5 py-2 text-sm text-white transition-all bg-indigo-500 rounded hover:bg-indigo-600 disabled:opacity-60'
              >
                {loading ? 'Adding...' : 'Add Staff'}
              </button>
              <button
                type='button'
                onClick={resetForm}
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

export default Staff
