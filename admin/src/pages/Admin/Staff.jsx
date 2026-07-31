import React, { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { toast } from 'react-toastify'
import axios from 'axios'
import { UserRoundPlus, Eye, EyeOff, Search, Download, X, Trash2, Pencil } from 'lucide-react'
import * as XLSX from 'xlsx'

const Staff = () => {
    const { aToken, backendUrl, staff, getAllStaff, deleteStaff, updateStaff } = useContext(AdminContext)

    useEffect(() => {
        if (aToken) getAllStaff()
    }, [aToken])
    const [showForm, setShowForm] = useState(false)

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('receptionist')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')

    const [editingMember, setEditingMember] = useState(null)
    const [editName, setEditName] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [editLoading, setEditLoading] = useState(false)

    const [deleteTarget, setDeleteTarget] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    const filteredStaff = staff.filter((member) => {
        const term = search.trim().toLowerCase()
        const matchesSearch = !term || member.name?.toLowerCase().includes(term)
        const matchesRole = roleFilter === 'all' || member.role === roleFilter

        return matchesSearch && matchesRole
    })

    const handleExport = () => {
        const header = ['Name', 'Role', 'Active']
        const rows = filteredStaff.map((member) => [
            member.name,
            member.role.charAt(0).toUpperCase() + member.role.slice(1),
            member.isActive ? 'Active' : 'Inactive'
        ])

        const ws = XLSX.utils.aoa_to_sheet([header, ...rows])
        ws['!cols'] = [
            { wch: 22 }, // Name
            { wch: 14 }, // Role
            { wch: 10 }, // Active
        ]
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Staff')
        XLSX.writeFile(wb, `staff-${new Date().toISOString().slice(0, 10)}.xlsx`)
    }

    const handleDelete = (member) => {
        setDeleteTarget(member)
    }

    const confirmDelete = async () => {
        setDeleteLoading(true)
        try {
            await deleteStaff(deleteTarget._id)
            setDeleteTarget(null)
        } finally {
            setDeleteLoading(false)
        }
    }

    const openEdit = (member) => {
        setEditingMember(member)
        setEditName(member.name)
        setEditEmail(member.email)
    }

    const closeEdit = () => {
        setEditingMember(null)
        setEditName('')
        setEditEmail('')
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        setEditLoading(true)
        try {
            const success = await updateStaff(editingMember._id, { name: editName, email: editEmail })
            if (success) closeEdit()
        } finally {
            setEditLoading(false)
        }
    }

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
            const { data } = await axios.post(backendUrl + '/api/admin/add-staff',
                { name, email, password, role },
                { headers: { aToken } }
            )
            if (data.success) {
                toast.success(data.message)
                getAllStaff()
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
        <div className='m-5'>

            {/* Header */}
            <div className='flex items-center justify-between mb-3'>
                <h1 className='text-lg font-medium'>Staff</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className='flex items-center gap-2 px-4 py-2 text-sm text-white transition-all bg-indigo-500 rounded hover:bg-indigo-600'
                >
                    <UserRoundPlus size={16} />
                    Add Staff
                </button>
            </div>

            {/* Search + Filter + Export toolbar */}
            <div className='flex items-center gap-3 mb-1'>
                <div className='relative flex-1 max-w-xs'>
                    <Search size={14} className='absolute text-gray-400 -translate-y-1/2 left-3 top-1/2' />
                    <input
                        type='text'
                        placeholder='Search by name'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className='w-full py-1.5 pl-8 pr-8 text-sm border rounded-lg focus:outline-none focus:border-primary'
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className='absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500'>
                            <X size={13} />
                        </button>
                    )}
                </div>

                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className='py-1.5 pl-3 pr-8 text-sm text-gray-600 border rounded-lg shrink-0 focus:outline-none focus:border-primary'
                >
                    <option value='all'>All Roles</option>
                    <option value='admin'>Admin</option>
                    <option value='receptionist'>Receptionist</option>
                </select>

                <button
                    onClick={handleExport}
                    className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors border rounded-lg shrink-0 hover:border-gray-300 hover:text-gray-800'
                >
                    <Download size={14} /> Export
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
                            <th className='px-6 py-3 font-medium text-center text-gray-500'>Edit</th>
                            <th className='px-6 py-3 font-medium text-center text-gray-500'>Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStaff.length > 0 ? (
                            filteredStaff.map((member, index) => (
                                <tr key={member._id} className='transition-colors border-b last:border-0 hover:bg-gray-50'>
                                    <td className='px-6 py-4 text-gray-400'>{index + 1}</td>
                                    <td className='px-6 py-4'>
                                        <p className='font-medium text-gray-800'>{member.name}</p>
                                    </td>
                                    <td className='px-6 py-4'>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${member.role === 'admin'
                                                ? 'bg-slate-100 text-slate-700'
                                                : 'bg-indigo-50 text-indigo-600'
                                            }`}>
                                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                        </span>
                                    </td>
                                    <td className='px-6 py-4'>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${member.isActive
                                                ? 'bg-green-50 text-green-600'
                                                : 'bg-red-50 text-red-500'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                                            {member.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className='px-6 py-4'>
                                        <div className='flex items-center justify-center'>
                                            <button
                                                onClick={() => openEdit(member)}
                                                title='Edit staff member'
                                                className='text-gray-400 transition-colors hover:text-indigo-500'
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className='px-6 py-4'>
                                        <div className='flex items-center justify-center'>
                                            {member.role !== 'admin' && (
                                                <button
                                                    onClick={() => handleDelete(member)}
                                                    title='Delete staff member'
                                                    className='text-gray-400 transition-colors hover:text-red-500'
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className='px-6 py-12 text-sm text-center text-gray-400'>
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

            {/* Edit Staff Modal */}
            {editingMember && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
                    <form
                        onSubmit={handleEditSubmit}
                        className='w-full max-w-md p-6 mx-4 bg-white shadow-xl rounded-xl'
                    >
                        <h2 className='mb-5 text-base font-medium text-neutral-700'>Edit Staff Member</h2>

                        <div className='mb-3'>
                            <label className='block mb-1 text-sm text-gray-600'>Full Name</label>
                            <input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                type='text'
                                placeholder='e.g. John Perera'
                                required
                                className='w-full px-3 py-2 text-sm transition-colors border border-gray-300 rounded outline-none focus:border-indigo-400'
                            />
                        </div>

                        <div className='mb-5'>
                            <label className='block mb-1 text-sm text-gray-600'>Email Address</label>
                            <input
                                value={editEmail}
                                onChange={e => setEditEmail(e.target.value)}
                                type='email'
                                placeholder='e.g. john@hospital.com'
                                required
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

            {/* Delete Confirmation Dialog */}
            {deleteTarget && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
                    <div className='w-full max-w-sm p-6 mx-4 bg-white shadow-xl rounded-xl'>
                        <h2 className='mb-2 text-base font-medium text-neutral-700'>Delete staff member?</h2>
                        <p className='mb-5 text-sm text-gray-500'>
                            This will permanently remove <span className='font-medium text-gray-700'>{deleteTarget.name}</span> from staff. This cannot be undone.
                        </p>

                        <div className='flex gap-3'>
                            <button
                                type='button'
                                onClick={confirmDelete}
                                disabled={deleteLoading}
                                className='px-5 py-2 text-sm text-white transition-all bg-red-500 rounded hover:bg-red-600 disabled:opacity-60'
                            >
                                {deleteLoading ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                                type='button'
                                onClick={() => setDeleteTarget(null)}
                                disabled={deleteLoading}
                                className='px-5 py-2 text-sm text-gray-600 transition-all border border-gray-300 rounded hover:bg-gray-100'
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default Staff
