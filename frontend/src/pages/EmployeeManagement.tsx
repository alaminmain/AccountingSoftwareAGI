import React, { useEffect, useState } from 'react';
import api from '../api/client';
import type { Employee, CreateEmployeeDto, Branch } from '../types/admin';
import { Pencil, Trash2, X, User as UserIcon } from 'lucide-react';

const EmployeeManagement: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [showForm, setShowForm] = useState(false);

    // Edit Mode State
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState<CreateEmployeeDto>({
        firstName: '',
        lastName: '',
        designation: '',
        department: '',
        branchId: 0,
        email: '',
        password: '',
        roles: []
    });

    const rolesList = ['TenantAdmin', 'Entry', 'Verifier', 'Approver'];

    useEffect(() => {
        fetchEmployees();
        fetchBranches();
    }, []);

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/employees');
            setEmployees(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchBranches = async () => {
        try {
            // Assuming tenant 1 for now, or fetch from current user's tenant if implemented
            const res = await api.get('/tenants/1/branches');
            setBranches(res.data);
            if (res.data.length > 0 && !editingId) {
                setFormData(prev => ({ ...prev, branchId: res.data[0].id }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRoleChange = (role: string) => {
        const currentRoles = formData.roles || [];
        if (currentRoles.includes(role)) {
            setFormData({ ...formData, roles: currentRoles.filter(r => r !== role) });
        } else {
            setFormData({ ...formData, roles: [...currentRoles, role] });
        }
    };

    const handleEdit = (employee: Employee) => {
        setEditingId(employee.id);
        setFormData({
            firstName: employee.firstName,
            lastName: employee.lastName,
            designation: employee.designation,
            department: employee.department,
            branchId: employee.branchId,
            email: employee.userName || '', // Read-only in edit for now or separate flow
            password: '', // Don't show password
            roles: [] // TODO: Fetch roles if needed, currently API doesn't return them easily
        });
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this employee?")) return;
        try {
            await api.delete(`/employees/${id}`);
            fetchEmployees();
        } catch (err: any) {
            alert('Error deleting employee: ' + (err.response?.data || err.message));
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData({
            firstName: '',
            lastName: '',
            designation: '',
            department: '',
            branchId: branches[0]?.id || 0,
            email: '',
            password: '',
            roles: []
        });
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/employees/${editingId}`, formData);
                alert('Employee updated successfully');
            } else {
                await api.post('/employees', formData);
                alert('Employee created successfully');
            }

            fetchEmployees();
            handleCancel();
        } catch (err: any) {
            alert('Error: ' + (err.response?.data || err.message));
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                    Employee Management
                </h1>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition shadow-sm flex items-center gap-2"
                    >
                        <UserIcon className="w-4 h-4" />
                        + New Employee
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 animate-fade-in relative">
                    <button
                        onClick={handleCancel}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <h2 className="text-xl font-semibold mb-6 text-gray-800">{editingId ? 'Edit Employee' : 'Add New Employee'}</h2>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Personal Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Details</h3>
                            <input
                                type="text" placeholder="First Name" required
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                            />
                            <input
                                type="text" placeholder="Last Name" required
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text" placeholder="Designation"
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    value={formData.designation} onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                />
                                <input
                                    type="text" placeholder="Department"
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}
                                />
                            </div>
                            <select
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                value={formData.branchId} onChange={e => setFormData({ ...formData, branchId: parseInt(e.target.value) })}
                            >
                                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>

                        {/* Account Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Account & Roles</h3>
                            <input
                                type="email" placeholder="Email (Login Username)"
                                disabled={!!editingId} // Disable email change on edit for now
                                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none ${editingId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                            {!editingId && (
                                <input
                                    type="password" placeholder="Password"
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            )}

                            {!editingId && (
                                <div className="pt-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Assign Roles</label>
                                    <div className="flex flex-wrap gap-2">
                                        {rolesList.map(role => (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => handleRoleChange(role)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium border transition
                                                    ${formData.roles?.includes(role)
                                                        ? 'bg-teal-100 text-teal-800 border-teal-200'
                                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {editingId && (
                                <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                                    Note: User account (Email/Password/Roles) modification is currently disabled in this view.
                                </p>
                            )}
                        </div>

                        <div className="col-span-1 md:col-span-2 flex justify-end gap-3 border-t pt-4">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-teal-600 text-white px-8 py-2 rounded-lg hover:bg-teal-700 font-medium transition shadow-sm"
                            >
                                {editingId ? 'Update Employee' : 'Create Employee'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-sm">
                        <tr>
                            <th className="p-4 font-medium">Name</th>
                            <th className="p-4 font-medium">Designation</th>
                            <th className="p-4 font-medium">Dept</th>
                            <th className="p-4 font-medium">Branch</th>
                            <th className="p-4 font-medium">User Account</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {employees.map(emp => (
                            <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-medium text-gray-800">{emp.firstName} {emp.lastName}</td>
                                <td className="p-4 text-gray-600">{emp.designation}</td>
                                <td className="p-4 text-gray-600">{emp.department}</td>
                                <td className="p-4 text-gray-600">{emp.branchName}</td>
                                <td className="p-4">
                                    {emp.userName ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {emp.userName}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs">No Access</span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(emp)}
                                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition"
                                            title="Edit"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(emp.id)}
                                            className="p-1.5 hover:bg-red-50 text-red-600 rounded transition"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {employees.length === 0 && <div className="p-10 text-center text-gray-400">No employees found.</div>}
            </div>
        </div>
    );
};

export default EmployeeManagement;
