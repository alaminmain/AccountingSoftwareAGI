import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, Edit, Trash2, Key, X, Save } from 'lucide-react';
import Swal from 'sweetalert2';

interface Tenant {
    id: number;
    name: string;
}

interface UserDto {
    id: number;
    userName: string;
    email: string;
    tenantId: number;
    branchId?: number;
    isTenantAdmin: boolean;
    roles: string[];
}

interface CreateUserDto {
    userName: string;
    email: string;
    password?: string;
    tenantId: number;
    branchId?: number;
    isTenantAdmin: boolean;
    roles: string[];
}

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<UserDto[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserDto | null>(null);
    const [formData, setFormData] = useState<CreateUserDto>({
        userName: '', email: '', password: '', tenantId: 0, roles: [], isTenantAdmin: false
    });
    const [resetPayload, setResetPayload] = useState({ userId: 0, newPassword: '' });

    useEffect(() => {
        fetchTenants();
        fetchUsers();
    }, [selectedTenantId]);

    const fetchTenants = async () => {
        try {
            const res = await api.get('/tenants');
            setTenants(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const url = selectedTenantId ? `/users?tenantId=${selectedTenantId}` : '/users';
            const res = await api.get(url);
            setUsers(res.data);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Failed to fetch users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingUser(null);
        setFormData({
            userName: '', email: '', password: '',
            tenantId: selectedTenantId || (tenants[0]?.id || 0),
            roles: ['User'], isTenantAdmin: false
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user: UserDto) => {
        setEditingUser(user);
        setFormData({
            userName: user.email,
            email: user.email,
            password: '', // Not used in update
            tenantId: user.tenantId,
            branchId: user.branchId,
            isTenantAdmin: user.isTenantAdmin,
            roles: user.roles
        });
        setIsModalOpen(true);
    };

    const handleOpenPassword = (user: UserDto) => {
        setResetPayload({ userId: user.id, newPassword: '' });
        setIsPasswordModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Are you sure?', text: "You won't be able to revert this!", icon: 'warning',
            showCancelButton: true, confirmButtonText: 'Yes, delete it!'
        });
        if (result.isConfirmed) {
            try {
                await api.delete(`/users/${id}`);
                fetchUsers();
                Swal.fire('Deleted!', 'User has been deleted.', 'success');
            } catch (error) {
                Swal.fire('Error', 'Failed to delete user', 'error');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, formData);
                Swal.fire('Success', 'User updated successfully', 'success');
            } else {
                await api.post('/users', formData);
                Swal.fire('Success', 'User created successfully', 'success');
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (err: any) {
            Swal.fire('Error', err.response?.data?.toString() || 'Operation failed', 'error');
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post(`/users/${resetPayload.userId}/reset-password`, { newPassword: resetPayload.newPassword });
            Swal.fire('Success', 'Password reset successfully', 'success');
            setIsPasswordModalOpen(false);
        } catch (err) {
            Swal.fire('Error', 'Failed to reset password', 'error');
        }
    };

    const toggleRole = (role: string) => {
        setFormData(prev => {
            const hasRole = prev.roles.includes(role);
            return {
                ...prev,
                roles: hasRole ? prev.roles.filter(r => r !== role) : [...prev.roles, role]
            };
        });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        User Management
                    </h1>
                    <p className="text-gray-500 mt-1">Manage users, roles, and access controls</p>
                </div>
                <button onClick={handleOpenCreate} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 shadow-md">
                    <Plus size={18} /> New User
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <span className="text-gray-600 font-medium">Filter by Tenant:</span>
                <select
                    value={selectedTenantId || ''}
                    onChange={e => setSelectedTenantId(e.target.value ? Number(e.target.value) : null)}
                    className="p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none min-w-[200px]"
                >
                    <option value="">All Tenants</option>
                    {tenants.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 border-b">
                        <tr>
                            <th className="p-4 font-semibold">User</th>
                            <th className="p-4 font-semibold">Tenant</th>
                            <th className="p-4 font-semibold">Roles/Status</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading users...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">No users found.</td></tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4">
                                        <div className="font-medium text-gray-800">{user.userName}</div>
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium border border-blue-100">
                                            {tenants.find(t => t.id === user.tenantId)?.name || 'Unknown'} (ID: {user.tenantId})
                                        </span>
                                    </td>
                                    <td className="p-4 space-y-1">
                                        <div className="flex gap-1 flex-wrap">
                                            {user.roles.map(r => (
                                                <span key={r} className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-medium border border-purple-100">
                                                    {r}
                                                </span>
                                            ))}
                                        </div>
                                        {user.isTenantAdmin && <span className="text-xs text-orange-600 font-bold block">Tenant Admin</span>}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button onClick={() => handleOpenPassword(user)} className="text-gray-400 hover:text-yellow-600 transition" title="Reset Password">
                                            <Key size={18} />
                                        </button>
                                        <button onClick={() => handleOpenEdit(user)} className="text-gray-400 hover:text-blue-600 transition" title="Edit">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(user.id)} className="text-gray-400 hover:text-red-600 transition" title="Delete">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 m-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">{editingUser ? 'Edit User' : 'Create New User'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email / Username</label>
                                <input required type="email"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="user@company.com"
                                />
                            </div>

                            {!editingUser && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input required type="password"
                                        value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="******"
                                        minLength={6}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tenant</label>
                                    <select required
                                        value={formData.tenantId} onChange={e => setFormData({ ...formData, tenantId: Number(e.target.value) })}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    >
                                        <option value="">Select Tenant</option>
                                        {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={formData.isTenantAdmin} onChange={e => setFormData({ ...formData, isTenantAdmin: e.target.checked })} className="w-4 h-4 text-purple-600" />
                                        <span className="text-sm font-medium text-gray-700">Is Tenant Admin</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                                <div className="flex gap-2">
                                    {['Admin', 'User', 'Approver', 'SuperAdmin'].map(role => (
                                        <button key={role} type="button"
                                            onClick={() => toggleRole(role)}
                                            className={`px-3 py-1 rounded-full text-sm font-medium border transition
                                                ${formData.roles.includes(role)
                                                    ? 'bg-purple-100 text-purple-700 border-purple-200'
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'}`}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition flex justify-center items-center gap-2">
                                <Save size={18} /> {editingUser ? 'Update User' : 'Create User'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 m-4 text-center">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-800">Reset Password</h2>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <input required type="text"
                                value={resetPayload.newPassword} onChange={e => setResetPayload({ ...resetPayload, newPassword: e.target.value })}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-center" placeholder="New Password"
                            />
                            <button type="submit" className="w-full bg-yellow-600 text-white py-2 rounded-lg font-medium hover:bg-yellow-700 transition">
                                Set Password
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default UserManagement;
