import React, { useEffect, useState } from 'react';
import api from '../api/client';
import type { Tenant, Branch, CreateTenantDto, CreateBranchDto } from '../types/admin';

const SuperAdminDashboard: React.FC = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);
    const [newTenantName, setNewTenantName] = useState('');
    const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
    const [newBranch, setNewBranch] = useState<CreateBranchDto>({ name: '', code: '', tenantId: 0 });

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        try {
            const res = await api.get('/tenants');
            setTenants(res.data);
            if (res.data.length > 0 && !selectedTenantId) {
                // Determine default selection optionally
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchBranches = async (tenantId: number) => {
        try {
            const res = await api.get(`/tenants/${tenantId}/branches`);
            setBranches(res.data);
            setSelectedTenantId(tenantId);
            setNewBranch({ ...newBranch, tenantId });
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dto: CreateTenantDto = { name: newTenantName };
            const res = await api.post('/tenants', dto);
            setTenants([...tenants, res.data]);
            setNewTenantName('');
        } catch (err) {
            alert('Failed to create tenant');
        }
    };

    const handleCreateBranch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenantId) return;
        try {
            const res = await api.post(`/tenants/${selectedTenantId}/branches`, newBranch);
            setBranches([...branches, res.data]);
            setNewBranch({ name: '', code: '', tenantId: selectedTenantId });
        } catch (err) {
            alert('Failed to create branch');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Super Admin Dashboard
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tenant Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Tenants (Companies)</h2>
                    <form onSubmit={handleCreateTenant} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            placeholder="New Tenant Name"
                            value={newTenantName}
                            onChange={(e) => setNewTenantName(e.target.value)}
                            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                            Add
                        </button>
                    </form>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {tenants.map(t => (
                            <div
                                key={t.id}
                                onClick={() => fetchBranches(t.id)}
                                className={`p-3 rounded-lg cursor-pointer flex justify-between items-center transition
                                    ${selectedTenantId === t.id ? 'bg-blue-50 border-blue-200 border' : 'bg-gray-50 hover:bg-gray-100'}`}
                            >
                                <span className="font-medium text-gray-700">{t.name}</span>
                                <span className="text-xs text-gray-400">ID: {t.id}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Branch Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">
                        Branches {selectedTenantId && <span className="text-sm font-normal text-gray-500">(for ID: {selectedTenantId})</span>}
                    </h2>

                    {selectedTenantId ? (
                        <>
                            <form onSubmit={handleCreateBranch} className="space-y-3 mb-4">
                                <input
                                    type="text"
                                    placeholder="Branch Name"
                                    value={newBranch.name}
                                    onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Code (e.g. HO)"
                                        value={newBranch.code}
                                        onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value })}
                                        className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                    <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
                                        Create Branch
                                    </button>
                                </div>
                            </form>
                            <div className="space-y-2">
                                {branches.length === 0 && <p className="text-gray-400 text-sm">No branches found.</p>}
                                {branches.map(b => (
                                    <div key={b.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                                        <span className="font-medium text-gray-700">{b.name}</span>
                                        <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">{b.code}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-40 text-gray-400">
                            Select a tenant to manage branches
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
