import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Plus, Trash, CheckCircle, Upload } from 'lucide-react';
import Swal from 'sweetalert2';

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
    subsidiaryTypeId?: number;
    isControlAccount?: boolean;
    parentId?: number;
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
    const [subsidiaries, setSubsidiaries] = useState<any[]>([]);
    const [attachment, setAttachment] = useState<File | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [accRes, subRes] = await Promise.all([
                    api.get('/ChartOfAccounts'),
                    api.get('/SubsidiaryLedgers')
                ]);

                const allAccounts = accRes.data;
                const parentIds = new Set(allAccounts.map((a: any) => a.parentId).filter((id: any) => id));
                const leafAccounts = allAccounts.filter((a: any) => !parentIds.has(a.id));

                setAccounts(leafAccounts);
                setSubsidiaries(subRes.data);

                if (id) {
                    const voucherRes = await api.get(`/Vouchers/${id}`);
                    const v = voucherRes.data;
                    if (v) {
                        setDate(v.date.split('T')[0]);
                        setNarration(v.narration || '');
                        setVoucherType(v.voucherType.toString());
                        setDetails(v.details.map((d: any) => ({
                            accountId: d.accountId,
                            subsidiaryLedgerId: d.subsidiaryLedgerId,
                            debitAmount: d.debitAmount,
                            creditAmount: d.creditAmount,
                            lineNarration: d.lineNarration || ''
                        })));
                    }
                }
            } catch (error) {
                console.error("Failed to load data", error);
            }
        };
        loadData();
    }, [id]);

    const handleChange = (index: number, field: keyof VoucherDetail, value: any) => {
        const newDetails = [...details];
        // @ts-ignore
        newDetails[index][field] = value;

        // Reset sub ledger if account changes
        if (field === 'accountId') {
            newDetails[index].subsidiaryLedgerId = null;
        }

        setDetails(newDetails);
    };

    const addRow = () => {
        setDetails([...details, { accountId: 0, debitAmount: 0, creditAmount: 0, lineNarration: '', subsidiaryLedgerId: null }]);
    };

    const removeRow = (index: number) => {
        setDetails(details.filter((_, i) => i !== index));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                Swal.fire("Error", "Only PDF and Image files are allowed.", "error");
                e.target.value = '';
                return;
            }
            setAttachment(file);
        }
    };

    const totalDebit = details.reduce((sum, d) => sum + Number(d.debitAmount), 0);
    const totalCredit = details.reduce((sum, d) => sum + Number(d.creditAmount), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

    const handleSubmit = async () => {
        if (!isBalanced) return Swal.fire("Error", "Voucher is not balanced!", "error");

        // Validate Sub Ledgers
        for (let i = 0; i < details.length; i++) {
            const row = details[i];
            const acc = accounts.find(a => a.id === row.accountId);
            if (acc && acc.subsidiaryTypeId && !row.subsidiaryLedgerId) {
                return Swal.fire("Error", `Row ${i + 1}: Account '${acc.code} - ${acc.name}' requires a Subsidiary Ledger.`, "error");
            }
        }

        const dto = {
            date,
            narration,
            voucherType: Number(voucherType),
            branchId: 1,
            details: details.map(d => ({
                accountId: d.accountId,
                subsidiaryLedgerId: d.subsidiaryLedgerId || null,
                debitAmount: Number(d.debitAmount),
                creditAmount: Number(d.creditAmount),
                lineNarration: d.lineNarration
            }))
        };

        const formData = new FormData();
        // If creating with attachment, we use FormData. If updating, we stick to JSON unless update supports multipart?
        // My Controller Update only supports JSON (CreateVoucherDto).
        // My Controller Create supports Multipart (CreateVoucherRequest).

        try {
            if (id) {
                // Update - currently JSON only
                await api.put(`/Vouchers/${id}`, dto);
                Swal.fire("Success", "Voucher Updated!", "success");
            } else {
                // Create - Multipart
                formData.append('dto', JSON.stringify(dto));
                if (attachment) {
                    formData.append('attachment', attachment);
                }
                await api.post('/Vouchers', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                Swal.fire("Success", "Voucher Created!", "success");
            }
            navigate('/approvals');
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to save voucher", "error");
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

                {!id && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Attachment (PDF/Image)</label>
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-md cursor-pointer border border-input text-sm">
                                <Upload className="w-4 h-4" />
                                {attachment ? attachment.name : "Choose File"}
                                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                            </label>
                            {attachment && (
                                <button onClick={() => setAttachment(null)} className="text-red-500 hover:text-red-700">
                                    <Trash className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-4 py-3 w-[25%]">Account</th>
                            <th className="px-4 py-3 w-[20%]">Subsidiary</th>
                            <th className="px-4 py-3">Debit</th>
                            <th className="px-4 py-3">Credit</th>
                            <th className="px-4 py-3">Line Narration</th>
                            <th className="px-4 py-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {details.map((row, i) => {
                            const selectedAccount = accounts.find(a => a.id === row.accountId);
                            const requiresSub = selectedAccount?.subsidiaryTypeId;
                            const relevantSubs = requiresSub
                                ? subsidiaries.filter(s => s.subsidiaryTypeId === selectedAccount.subsidiaryTypeId)
                                : [];

                            return (
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
                                        {requiresSub ? (
                                            <select
                                                value={row.subsidiaryLedgerId || ''}
                                                onChange={e => handleChange(i, 'subsidiaryLedgerId', Number(e.target.value))}
                                                className="w-full bg-yellow-50/50 border border-yellow-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-yellow-400"
                                            >
                                                <option value="">Select...</option>
                                                {relevantSubs.map(sub => (
                                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
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
                            );
                        })}
                    </tbody>
                    <tfoot className="bg-muted/50 font-semibold">
                        <tr>
                            <td colSpan={2} className="px-4 py-3 text-right">Total</td>
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
                <button
                    onClick={() => navigate('/approvals')}
                    className="px-6 py-2 rounded-md border text-muted-foreground hover:bg-muted"
                >
                    Cancel
                </button>
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
