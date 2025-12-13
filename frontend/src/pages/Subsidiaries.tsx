import { useEffect, useState } from 'react';
import api from '../api/client';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import Swal from 'sweetalert2';

interface SubsidiaryType {
    id: number;
    name: string;
}

interface ChartOfAccount {
    id: number;
    code: string;
    name: string;
    isControlAccount: boolean;
}

interface Subsidiary {
    id: number;
    name: string;
    code: string;
    address?: string;
    subsidiaryTypeId: number;
    subsidiaryType?: SubsidiaryType;
    controlAccountId: number;
    controlAccount?: ChartOfAccount;
    isActive: boolean;
}

export const Subsidiaries = () => {
    const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
    const [types, setTypes] = useState<SubsidiaryType[]>([]);
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        subsidiaryTypeId: 0,
        controlAccountId: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [subRes, typeRes, accRes] = await Promise.all([
                api.get('/SubsidiaryLedgers'),
                api.get('/SubsidiaryTypes'),
                api.get('/ChartOfAccounts')
            ]);
            setSubsidiaries(subRes.data);
            setTypes(typeRes.data);
            setAccounts(accRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (sub?: Subsidiary) => {
        if (sub) {
            setCurrentId(sub.id);
            setFormData({
                name: sub.name,
                code: sub.code,
                address: sub.address || '',
                subsidiaryTypeId: sub.subsidiaryTypeId,
                controlAccountId: sub.controlAccountId
            });
        } else {
            setCurrentId(null);
            setFormData({
                name: '',
                code: '',
                address: '',
                subsidiaryTypeId: 0,
                controlAccountId: 0
            });
        }
        setIsModalOpen(true);
    };

    const handleTypeChange = (typeId: number) => {
        // If editing, usually we don't auto-change code, but if type changes, maybe we should?
        // Let's only auto-gen for new records to avoid messing up existing ones.
        if (!currentId) {
            const type = types.find(t => t.id === typeId);
            if (type) {
                const prefix = type.name.toUpperCase().substring(0, 1);
                // Simple count + 1 logic. Note: This can have race conditions or duplicates if deleted.
                // Ideally backend logic, but Frontend requested.
                // Find existing codes starting with prefix
                // Better: just count subs of this type.
                const count = subsidiaries.filter(s => s.subsidiaryTypeId === typeId).length;
                const nextCode = `${prefix}-${String(count + 1).padStart(3, '0')}`;
                setFormData(prev => ({ ...prev, subsidiaryTypeId: typeId, code: nextCode }));
            } else {
                setFormData(prev => ({ ...prev, subsidiaryTypeId: typeId }));
            }
        } else {
            setFormData(prev => ({ ...prev, subsidiaryTypeId: typeId }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentId) {
                await api.put(`/SubsidiaryLedgers/${currentId}`, { ...formData, id: currentId });
                Swal.fire("Success", "Subsidiary updated successfully.", "success");
            } else {
                await api.post('/SubsidiaryLedgers', formData);
                Swal.fire("Success", "Subsidiary created successfully.", "success");
            }
            await fetchData();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving subsidiary:", error);
            Swal.fire("Error", "Failed to save subsidiary.", "error");
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/SubsidiaryLedgers/${id}`);
                await fetchData();
                Swal.fire("Deleted!", "Subsidiary has been deleted.", "success");
            } catch (error) {
                console.error("Error deleting subsidiary:", error);
                Swal.fire("Error", "Failed to delete subsidiary.", "error");
            }
        }
    };

    const filteredSubsidiaries = subsidiaries.filter(sub =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Subsidiary Ledgers</h1>
                    <p className="text-muted-foreground">Manage customers, vendors, and other sub-ledgers</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Subsidiary
                </button>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm p-4">
                <div className="flex items-center gap-2 mb-4 max-w-sm">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search subsidiaries..."
                        className="flex-1 bg-transparent border-none outline-none text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Code</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Name</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Type</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Control Account</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Address</th>
                                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {filteredSubsidiaries.map(sub => (
                                <tr key={sub.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 font-medium">{sub.code}</td>
                                    <td className="p-4">{sub.name}</td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                            {// Fallback if navigation property missing, try to find in types list
                                                sub.subsidiaryType?.name || types.find(t => t.id === sub.subsidiaryTypeId)?.name || 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-muted-foreground">
                                        {sub.controlAccount?.name || accounts.find(a => a.id === sub.controlAccountId)?.name || 'N/A'}
                                    </td>
                                    <td className="p-4 text-muted-foreground truncate max-w-[200px]">{sub.address}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(sub)}
                                                className="p-2 hover:bg-muted rounded-md transition-colors text-blue-600"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(sub.id)}
                                                className="p-2 hover:bg-muted rounded-md transition-colors text-red-600"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredSubsidiaries.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                        No subsidiaries found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">{currentId ? 'Edit Subsidiary' : 'New Subsidiary'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Code</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    value={formData.code}
                                    // Allow manual override
                                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground mt-1">Auto-generated based on Type. You can edit it.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Type</label>
                                <select
                                    className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    value={formData.subsidiaryTypeId}
                                    onChange={e => handleTypeChange(Number(e.target.value))}
                                >
                                    <option value={0}>Select Type</option>
                                    {types.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Control Account</label>
                                <select
                                    className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    value={formData.controlAccountId}
                                    onChange={e => setFormData({ ...formData, controlAccountId: Number(e.target.value) })}
                                >
                                    <option value={0}>Select Control Account</option>
                                    {accounts.filter(a => a.isControlAccount).map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.code} - {a.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Address</label>
                                <textarea
                                    className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    rows={3}
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
                                >
                                    {currentId ? 'Save Changes' : 'Create Subsidiary'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
