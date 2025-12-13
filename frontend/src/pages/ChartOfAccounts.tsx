import { useEffect, useState } from 'react';
import api from '../api/client';
import { ChevronRight, ChevronDown, Folder, File, Plus, Pencil, Trash2, X, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import Swal from 'sweetalert2';

enum AccountType {
    Asset = 1,
    Liability = 2,
    Equity = 3,
    Revenue = 4,
    Expense = 5
}

interface SubsidiaryType {
    id: number;
    name: string;
}

interface ChartOfAccount {
    id: number;
    code: string;
    name: string;
    type: number;
    accountLevel: number;
    parentId?: number;
    isControlAccount: boolean;
    subsidiaryTypeId?: number;
    isActive: boolean;
    children: ChartOfAccount[];
}

interface AccountNodeProps {
    node: ChartOfAccount;
    level: number;
    onAddChild: (parentId: number) => void;
    onEdit: (account: ChartOfAccount) => void;
    onDelete: (id: number) => void;
}

const AccountNode = ({ node, level, onAddChild, onEdit, onDelete }: AccountNodeProps) => {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="select-none">
            <div
                className={cn(
                    "group flex items-center gap-2 py-2 px-2 hover:bg-muted/50 rounded-sm cursor-pointer transition-colors",
                    level === 0 && "font-bold text-lg border-b mt-2",
                    level === 1 && "font-semibold text-md ml-4",
                    level > 1 && "text-sm" // Indentation handled by paddingLeft
                )}
                style={{ paddingLeft: `${level * 24}px` }}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
            >
                <div className="w-4 flex-shrink-0">
                    {hasChildren ? (
                        isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    ) : null}
                </div>

                {node.isControlAccount ? (
                    <Folder className={cn("w-4 h-4 flex-shrink-0 text-amber-500", level === 0 && "w-5 h-5")} />
                ) : (
                    <File className="w-4 h-4 flex-shrink-0 text-blue-500" />
                )}

                <span className="font-mono text-muted-foreground mr-2 min-w-[60px]">{node.code}</span>
                <span className="truncate">{node.name}</span>

                <div className="ml-auto opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                    {node.isControlAccount && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
                            className="p-1.5 hover:bg-muted-foreground/10 rounded-md text-green-600"
                            title="Add Child"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(node); }}
                        className="p-1.5 hover:bg-muted-foreground/10 rounded-md text-blue-600"
                        title="Edit"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {!hasChildren && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
                            className="p-1.5 hover:bg-muted-foreground/10 rounded-md text-red-600"
                            title="Delete"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {isOpen && hasChildren && (
                <div>
                    {node.children.map(child => (
                        <AccountNode
                            key={child.id}
                            node={child}
                            level={level + 1}
                            onAddChild={onAddChild}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const ChartOfAccounts = () => {
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]); // Tree structure
    const [flatAccounts, setFlatAccounts] = useState<ChartOfAccount[]>([]); // Flat list for generic lookup/dropdowns
    const [subTypes, setSubTypes] = useState<SubsidiaryType[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: 1,
        accountLevel: 1,
        parentId: 0,
        isControlAccount: false,
        subsidiaryTypeId: 0
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [accRes, typeRes] = await Promise.all([
                api.get('/ChartOfAccounts'),
                api.get('/SubsidiaryTypes')
            ]);

            const flatList: ChartOfAccount[] = accRes.data;
            setFlatAccounts(flatList);
            setSubTypes(typeRes.data);

            setAccounts(buildTree(JSON.parse(JSON.stringify(flatList)))); // Deep copy to avoid mutating flatList during tree build
        } catch (err) {
            console.error("Failed to load COA", err);
        } finally {
            setLoading(false);
        }
    };

    const buildTree = (items: ChartOfAccount[]) => {
        const rootItems: ChartOfAccount[] = [];
        const lookup: Record<number, ChartOfAccount> = {};

        items.forEach(item => {
            item.children = [];
            lookup[item.id] = item;
        });

        items.forEach(item => {
            if (item.parentId && lookup[item.parentId]) {
                lookup[item.parentId].children.push(item);
            } else {
                rootItems.push(item);
            }
        });

        return rootItems;
    };

    const generateNextCode = (parentId: number, parentCode = '') => {
        const siblings = flatAccounts.filter(a => a.parentId === (parentId === 0 ? null : parentId));

        if (parentId === 0) {
            // Root level
            const roots = flatAccounts.filter(a => !a.parentId);
            const maxRoot = roots.reduce((max, curr) => (Number(curr.code) > max ? Number(curr.code) : max), 0);
            return maxRoot ? (maxRoot + 1).toString() : '1';
        }

        // Children
        if (siblings.length === 0) {
            return `${parentCode}01`;
        }

        // Sort by code
        const sorted = siblings.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
        const last = sorted[sorted.length - 1];

        // If last is numeric, increment
        if (!isNaN(Number(last.code))) {
            return (Number(last.code) + 1).toString();
        }

        // Fallback: Append number based on count
        return `${parentCode}${String(siblings.length + 1).padStart(2, '0')}`;
    }

    const handleCreateRoot = () => {
        setCurrentId(null);
        const nextCode = generateNextCode(0);
        setFormData({
            code: nextCode,
            name: '',
            type: 1,
            accountLevel: 1,
            parentId: 0,
            isControlAccount: true,
            subsidiaryTypeId: 0
        });
        setIsModalOpen(true);
    };

    const handleAddChild = (parentId: number) => {
        const parent = flatAccounts.find(a => a.id === parentId);
        if (!parent) return;

        setCurrentId(null);
        const nextCode = generateNextCode(parentId, parent.code);
        setFormData({
            code: nextCode,
            name: '',
            type: parent.type,
            accountLevel: parent.accountLevel + 1,
            parentId: parentId,
            isControlAccount: false,
            subsidiaryTypeId: 0
        });
        setIsModalOpen(true);
    };

    const handleEdit = (account: ChartOfAccount) => {
        setCurrentId(account.id);
        setFormData({
            code: account.code,
            name: account.name,
            type: account.type,
            accountLevel: account.accountLevel,
            parentId: account.parentId || 0,
            isControlAccount: account.isControlAccount,
            subsidiaryTypeId: account.subsidiaryTypeId || 0
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/ChartOfAccounts/${id}`);
                await fetchData();
                Swal.fire('Deleted!', 'Account has been deleted.', 'success');
            } catch (error) {
                console.error("Error deleting account:", error);
                Swal.fire('Error', 'Failed to delete account.', 'error');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                parentId: formData.parentId === 0 ? null : formData.parentId,
                subsidiaryTypeId: formData.subsidiaryTypeId === 0 ? null : formData.subsidiaryTypeId
            };

            if (currentId) {
                await api.put(`/ChartOfAccounts/${currentId}`, { ...payload, id: currentId });
                Swal.fire('Success', 'Account updated successfully', 'success');
            } else {
                await api.post('/ChartOfAccounts', payload);
                Swal.fire('Success', 'Account created successfully', 'success');
            }
            await fetchData();
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving account:", error);
            Swal.fire('Error', 'Failed to save account.', 'error');
        }
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
                    <p className="text-muted-foreground">Manage your general ledger accounts structure</p>
                </div>
                <button
                    onClick={handleCreateRoot}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Root Account
                </button>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm p-6 overflow-hidden min-h-[500px]">
                {accounts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <AlertCircle className="w-10 h-10 mb-4 opacity-20" />
                        <p>No accounts found. Create a root account to get started.</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {accounts.map(node => (
                            <AccountNode
                                key={node.id}
                                node={node}
                                level={0}
                                onAddChild={handleAddChild}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-background rounded-lg shadow-lg w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">{currentId ? 'Edit Account' : 'New Account'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Account Code</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Account Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Account Type</label>
                                    <select
                                        className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: Number(e.target.value) })}
                                    >
                                        <option value={AccountType.Asset}>Asset</option>
                                        <option value={AccountType.Liability}>Liability</option>
                                        <option value={AccountType.Equity}>Equity</option>
                                        <option value={AccountType.Revenue}>Revenue</option>
                                        <option value={AccountType.Expense}>Expense</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Parent Account</label>
                                    <select
                                        className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                                        value={formData.parentId}
                                        onChange={e => setFormData({ ...formData, parentId: Number(e.target.value) })}
                                        disabled={formData.parentId !== 0 && !currentId}
                                    >
                                        <option value={0}>None (Root)</option>
                                        {flatAccounts.filter(a => a.isControlAccount).map(a => (
                                            <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Subsidiary Type (Optional)</label>
                                <select
                                    className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    value={formData.subsidiaryTypeId}
                                    onChange={e => setFormData({ ...formData, subsidiaryTypeId: Number(e.target.value) })}
                                >
                                    <option value={0}>None</option>
                                    {subTypes.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted-foreground mt-1">If selected, this account will require a {subTypes.find(t => t.id === formData.subsidiaryTypeId)?.name || 'subsidiary'} for every transaction.</p>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isControl"
                                    className="rounded border-input text-primary focus:ring-primary"
                                    checked={formData.isControlAccount}
                                    onChange={e => setFormData({ ...formData, isControlAccount: e.target.checked })}
                                />
                                <label htmlFor="isControl" className="text-sm font-medium cursor-pointer">
                                    Is Control Account?
                                    <span className="block text-xs font-normal text-muted-foreground">Control accounts can have sub-accounts but usually no direct transactions.</span>
                                </label>
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
                                    {currentId ? 'Save Changes' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
