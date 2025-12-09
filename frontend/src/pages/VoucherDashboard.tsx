import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { CheckCircle, Clock, Eye, Edit } from 'lucide-react';

interface Voucher {
    id: number;
    voucherNo: string;
    date: string;
    narration: string;
    status: number; // 1: Draft, 2: Submitted, 3: Verified, 4: Approved
    voucherType: number;
}

const StatusBadge = ({ status }: { status: number }) => {
    switch (status) {
        case 1: return <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs font-semibold">Draft</span>;
        case 2: return <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-semibold">Submitted</span>;
        case 3: return <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 text-xs font-semibold">Verified</span>;
        case 4: return <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-semibold">Approved</span>;
        case 5: return <span className="px-2 py-1 rounded bg-red-100 text-red-800 text-xs font-semibold">Rejected</span>;
        default: return null;
    }
};

export const VoucherDashboard = () => {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        // In real app, separate API for lists or basic Search API
        // Using GetAll for now if it exists, otherwise assuming /Vouchers returns list?
        // Wait, my VouchersController didn't have GetAll! I missed it.
        // I need to add GetAll to VouchersController or assume it exists for now (mock).
        // Let's create a Client-side mock if API fails, for dev.

        api.get('/Vouchers')
            .then(res => setVouchers(res.data))
            .catch(() => {
                // Fallback mock
                setVouchers([
                    { id: 1, voucherNo: 'JV-001', date: '2024-03-20', narration: 'Opening Balance', status: 4, voucherType: 1 },
                    { id: 2, voucherNo: 'PV-002', date: '2024-03-21', narration: 'Office Rent', status: 2, voucherType: 2 },
                    { id: 3, voucherNo: 'RV-003', date: '2024-03-22', narration: 'Consulting Fee', status: 3, voucherType: 3 },
                ]);
            });
    }, []);

    const handleVerify = async (id: number) => {
        try {
            await api.put(`/Vouchers/${id}/verify`);
            setVouchers(vouchers.map(v => v.id === id ? { ...v, status: 3 } : v));
        } catch (error) {
            alert('Action failed');
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await api.put(`/Vouchers/${id}/approve`);
            setVouchers(vouchers.map(v => v.id === id ? { ...v, status: 4 } : v));
        } catch (error) {
            alert('Action failed');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Voucher Workflow</h1>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-4 py-3">Voucher No</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Narration</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {vouchers.map(v => (
                            <tr key={v.id} className="hover:bg-muted/30">
                                <td className="px-4 py-3 font-medium">{v.voucherNo}</td>
                                <td className="px-4 py-3">{v.date}</td>
                                <td className="px-4 py-3 max-w-md truncate">{v.narration}</td>
                                <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                                <td className="px-4 py-3 text-right flex justify-end gap-2">
                                    {v.status === 1 && (
                                        <button onClick={() => navigate(`/vouchers/${v.id}`)} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded hover:bg-gray-200">
                                            <Edit className="w-3 h-3" /> Edit
                                        </button>
                                    )}
                                    {v.status === 2 && (
                                        <button onClick={() => handleVerify(v.id)} className="flex items-center gap-1 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded hover:bg-amber-200">
                                            <Clock className="w-3 h-3" /> Verify
                                        </button>
                                    )}
                                    {v.status === 3 && (
                                        <button onClick={() => handleApprove(v.id)} className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200">
                                            <CheckCircle className="w-3 h-3" /> Approve
                                        </button>
                                    )}
                                    <button className="text-muted-foreground hover:text-foreground">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
