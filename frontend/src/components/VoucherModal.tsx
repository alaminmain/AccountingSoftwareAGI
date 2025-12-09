import { useEffect, useState } from 'react';
import api from '../api/client';
import { X, Printer } from 'lucide-react';

interface VoucherDetail {
    accountId: number;
    account?: { name: string; code: string };
    subsidiaryLedgerId?: number | null;
    subsidiaryLedger?: { name: string; code: string };
    debitAmount: number;
    creditAmount: number;
    lineNarration: string;
}

interface Voucher {
    id: number;
    date: string;
    voucherNo: string;
    narration: string;
    voucherType: number;
    status: number;
    details: VoucherDetail[];
    verifiedBy?: string;
    approvedBy?: string;
}

interface VoucherModalProps {
    voucherId: number;
    onClose: () => void;
}

const voucherTypes = {
    1: 'Journal',
    2: 'Payment',
    3: 'Receipt',
    4: 'Contra'
};

const voucherStatuses = {
    1: 'Draft',
    2: 'Submitted',
    3: 'Verified',
    4: 'Approved',
    5: 'Rejected'
};

export const VoucherModal = ({ voucherId, onClose }: VoucherModalProps) => {
    const [voucher, setVoucher] = useState<Voucher | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVoucher = async () => {
            try {
                const res = await api.get(`/Vouchers/${voucherId}`);
                setVoucher(res.data);
            } catch (error) {
                console.error("Failed to fetch voucher", error);
            } finally {
                setLoading(false);
            }
        };

        if (voucherId) fetchVoucher();
    }, [voucherId]);

    if (!voucherId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold">Voucher Details</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => window.print()} className="p-2 hover:bg-muted rounded-full text-muted-foreground">
                            <Printer className="w-5 h-5" />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 space-y-6">
                    {loading ? (
                        <div className="text-center py-10">Loading...</div>
                    ) : voucher ? (
                        <>
                            {/* Voucher Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-lg border">
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase font-semibold">Voucher No</label>
                                    <p className="font-mono font-medium">{voucher.voucherNo}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase font-semibold">Date</label>
                                    <p className="font-medium">{new Date(voucher.date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase font-semibold">Type</label>
                                    <p className="font-medium">{voucherTypes[voucher.voucherType as keyof typeof voucherTypes]}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground uppercase font-semibold">Status</label>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${voucher.status === 4 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {voucherStatuses[voucher.status as keyof typeof voucherStatuses]}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-muted-foreground uppercase font-semibold">Narration</label>
                                <p className="text-sm bg-muted/10 p-2 rounded border">{voucher.narration}</p>
                            </div>

                            {/* Details Table */}
                            <div className="rounded-lg border overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted text-muted-foreground uppercase text-xs font-semibold">
                                        <tr>
                                            <th className="px-4 py-2">Account</th>
                                            <th className="px-4 py-2">Narration</th>
                                            <th className="px-4 py-2 text-right">Debit</th>
                                            <th className="px-4 py-2 text-right">Credit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {voucher.details.map((row, i) => (
                                            <tr key={i} className="hover:bg-muted/30">
                                                <td className="px-4 py-2">
                                                    <div>
                                                        <span className="font-medium block">{row.account?.name || `Account #${row.accountId}`}</span>
                                                        <span className="text-xs text-muted-foreground">{row.account?.code}</span>
                                                        {row.subsidiaryLedger && (
                                                            <span className="text-xs text-blue-600 block pl-2">↳ {row.subsidiaryLedger.name}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-muted-foreground">{row.lineNarration}</td>
                                                <td className="px-4 py-2 text-right">{row.debitAmount > 0 ? row.debitAmount.toFixed(2) : '-'}</td>
                                                <td className="px-4 py-2 text-right">{row.creditAmount > 0 ? row.creditAmount.toFixed(2) : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-muted/50 font-semibold border-t">
                                        <tr>
                                            <td colSpan={2} className="px-4 py-2 text-right">Total</td>
                                            <td className="px-4 py-2 text-right">
                                                {voucher.details.reduce((s, d) => s + d.debitAmount, 0).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                {voucher.details.reduce((s, d) => s + d.creditAmount, 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Footer / Approvals */}
                            <div className="grid grid-cols-2 gap-8 text-sm text-muted-foreground pt-4 border-t mt-4">
                                <div>
                                    <p>Verified By: <span className="text-foreground">{voucher.verifiedBy || 'N/A'}</span></p>
                                </div>
                                <div className="text-right">
                                    <p>Approved By: <span className="text-foreground">{voucher.approvedBy || 'N/A'}</span></p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-red-500">Failed to load voucher details</div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-4 border-t flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Close</button>
                </div>
            </div>
        </div>
    );
};
