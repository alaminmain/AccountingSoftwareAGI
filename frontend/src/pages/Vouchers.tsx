import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Plus, Trash, CheckCircle } from 'lucide-react';

interface VoucherDetail {
    accountId: number;
    subsidiaryLedgerId?: number | null;
    debitAmount: number;
    creditAmount: number;
    lineNarration: string;
}

interface Account {
    id: number;
    name: string;
    code: string;
}

export const Vouchers = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [narration, setNarration] = useState('');
    const [voucherType, setVoucherType] = useState('1'); // Journal
    const [details, setDetails] = useState<VoucherDetail[]>([
        { accountId: 0, debitAmount: 0, creditAmount: 0, lineNarration: '', subsidiaryLedgerId: null },
        { accountId: 0, debitAmount: 0, creditAmount: 0, lineNarration: '', subsidiaryLedgerId: null }
    ]);
    const [accounts, setAccounts] = useState<Account[]>([]);

    useEffect(() => {
        api.get('/ChartOfAccounts').then(res => {
            const allAccounts = res.data as any[];
            // Filter only leaf nodes (those that are not parents of any other account)
            // Or ideally use IsControlAccount flag if available. 
            // Assuming IsControlAccount = true means it's a folder/parent.
            // Let's check if 'children' or 'isControlAccount' is available. 
            // If flat list, check parentId presence.
            const leafAccounts = allAccounts.filter(acc =>
                // Either explicit IsControlAccount flag is false (if API returns it)
                (acc.isControlAccount === false) ||
                // OR no other account points to this as parent
                !allAccounts.some(child => child.parentId === acc.id)
            );
            setAccounts(leafAccounts);
        });

        if (id) {
            api.get(`/Vouchers?tenantId=1`).then(res => { // Ideally fetch single by ID
                // My getAll API returns all. I should assume I might not have GetById endpoint exposed perfectly?
                // Wait, Update uses POST /Vouchers? No, PUT /Vouchers/{id}.
                // VerifyController has GetById logic internally.
                // I should check if I have GET /api/Vouchers/{id}.
                // VouchersController.cs doesn't seem to have a specific GET by ID. Only GetAll.
                // I will filter from GetAll for now to save time, OR add GetById.
                // Adding GetById is cleaner.
                // Use GetAll for now as fallback.
                const voucher = (res.data as any[]).find((v: any) => v.id == id);
                if (voucher) {
                    setDate(voucher.date.split('T')[0]);
                    setNarration(voucher.narration);
                    setVoucherType(voucher.voucherType.toString());
                    setDetails(voucher.details.map((d: any) => ({
                        accountId: d.accountId,
                        subsidiaryLedgerId: d.subsidiaryLedgerId,
                        debitAmount: d.debitAmount,
                        creditAmount: d.creditAmount,
                        lineNarration: d.lineNarration || ''
                    })));
                }
            });
        }
    }, [id]);

    const handleChange = (index: number, field: keyof VoucherDetail, value: any) => {
        const newDetails = [...details];
        // @ts-ignore
        newDetails[index][field] = value;
        setDetails(newDetails);
    };

    const addRow = () => {
        setDetails([...details, { accountId: 0, debitAmount: 0, creditAmount: 0, lineNarration: '', subsidiaryLedgerId: null }]);
    };

    const removeRow = (index: number) => {
        setDetails(details.filter((_, i) => i !== index));
    };

    const totalDebit = details.reduce((sum, d) => sum + Number(d.debitAmount), 0);
    const totalCredit = details.reduce((sum, d) => sum + Number(d.creditAmount), 0);
    const isBalanced = totalDebit === totalCredit && totalDebit > 0;

    const handleSubmit = async () => {
        if (!isBalanced) return alert("Voucher is not balanced!");

        const payload = {
            date,
            narration,
            voucherType: Number(voucherType),
            branchId: 1,
            details: details.map(d => ({
                ...d,
                debitAmount: Number(d.debitAmount),
                creditAmount: Number(d.creditAmount)
            }))
        };

        try {
            if (id) {
                await api.put(`/Vouchers/${id}`, payload);
                alert("Voucher Updated!");
            } else {
                await api.post('/Vouchers', payload);
                alert("Voucher Saved!");
            }
            navigate('/approvals');
        } catch (error) {
            console.error(error);
            alert("Failed to save voucher");
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{id ? 'Edit Voucher' : 'Voucher Entry'}</h1>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-background border border-input rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select value={voucherType} onChange={e => setVoucherType(e.target.value)} className="w-full bg-background border border-input rounded px-3 py-2">
                            <option value="1">Journal</option>
                            <option value="2">Payment</option>
                            <option value="3">Receipt</option>
                            <option value="4">Contra</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Branch</label>
                        <input disabled value="Head Office" className="w-full bg-background border border-input rounded px-3 py-2 opacity-50" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Narration</label>
                    <input value={narration} onChange={e => setNarration(e.target.value)} className="w-full bg-background border border-input rounded px-3 py-2" placeholder="Overall description..." />
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-4 py-3">Account</th>
                            <th className="px-4 py-3">Debit</th>
                            <th className="px-4 py-3">Credit</th>
                            <th className="px-4 py-3">Line Narration</th>
                            <th className="px-4 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {details.map((row, i) => (
                            <tr key={i} className="hover:bg-muted/30">
                                <td className="p-2">
                                    <select
                                        value={row.accountId}
                                        onChange={e => handleChange(i, 'accountId', Number(e.target.value))}
                                        className="w-full bg-transparent border-none focus:ring-0"
                                    >
                                        <option value={0}>Select Account</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="p-2">
                                    <input
                                        type="number"
                                        value={row.debitAmount}
                                        onChange={e => handleChange(i, 'debitAmount', e.target.value)}
                                        className="w-full bg-transparent border-none focus:ring-0"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        type="number"
                                        value={row.creditAmount}
                                        onChange={e => handleChange(i, 'creditAmount', e.target.value)}
                                        className="w-full bg-transparent border-none focus:ring-0"
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        value={row.lineNarration}
                                        onChange={e => handleChange(i, 'lineNarration', e.target.value)}
                                        className="w-full bg-transparent border-none focus:ring-0"
                                        placeholder="Description"
                                    />
                                </td>
                                <td className="p-2 text-center">
                                    <button onClick={() => removeRow(i)} className="text-red-500 hover:text-red-700">
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-muted/50 font-semibold">
                        <tr>
                            <td className="px-4 py-3">Total</td>
                            <td className="px-4 py-3 text-green-600">{totalDebit.toFixed(2)}</td>
                            <td className="px-4 py-3 text-green-600">{totalCredit.toFixed(2)}</td>
                            <td colSpan={2} className="text-right px-4">
                                {isBalanced ? (
                                    <span className="flex items-center justify-end gap-2 text-green-600">
                                        balanced <CheckCircle className="w-4 h-4" />
                                    </span>
                                ) : (
                                    <span className="text-red-500">Unbalanced ({Math.abs(totalDebit - totalCredit).toFixed(2)})</span>
                                )}
                            </td>
                        </tr>
                    </tfoot>
                </table>
                <div className="p-2 border-t border-border">
                    <button onClick={addRow} className="flex items-center gap-2 text-sm text-primary hover:underline px-2">
                        <Plus className="w-4 h-4" /> Add Row
                    </button>
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <button className="px-6 py-2 rounded-md border text-muted-foreground hover:bg-muted">Cancel</button>
                <button
                    onClick={handleSubmit}
                    disabled={!isBalanced}
                    className="px-6 py-2 rounded-md bg-primary text-primary-foreground font-medium disabled:opacity-50"
                >
                    Save Voucher
                </button>
            </div>
        </div>
    );
};
