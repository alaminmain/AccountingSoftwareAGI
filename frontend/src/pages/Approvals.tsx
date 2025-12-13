import { useEffect, useState } from 'react';
import api from '../api/client';
import { CheckCircle, Search, Eye } from 'lucide-react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

interface Voucher {
    id: number;
    date: string;
    voucherNo: string;
    narration: string;
    voucherType: number;
    status: number;
    details: any[];
}

export const Approvals = () => {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/Vouchers'); // Gets all. Ideally, /Vouchers/PendingApproval or filter param
            // Show Draft (0) and Verified (1) vouchers
            const pending = res.data.filter((v: Voucher) => v.status === 0 || v.status === 1);
            setVouchers(pending);
        } catch (error) {
            console.error("Failed to fetch vouchers", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id: number) => {
        try {
            await api.put(`/Vouchers/${id}/verify`);
            Swal.fire("Success", "Voucher Verified!", "success");
            fetchData();
        } catch (error) {
            console.error("Error verifying:", error);
            Swal.fire("Error", "Failed to verify voucher.", "error");
        }
    };

    const handleApprove = async (id: number) => {
        const result = await Swal.fire({
            title: 'Approve Voucher?',
            text: "This action will finalize the voucher.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Approve!'
        });

        if (result.isConfirmed) {
            try {
                await api.put(`/Vouchers/${id}/approve`); // Endpoint per VouchersController
                Swal.fire("Approved!", "Voucher has been approved.", "success");
                fetchData();
            } catch (error) {
                console.error("Error approving:", error);
                Swal.fire("Error", "Failed to approve voucher.", "error");
            }
        }
    };



    const getStatusBadge = (status: number) => {
        switch (status) {
            case 0: return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Draft</span>;
            case 1: return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Verified</span>;
            case 2: return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Approved</span>;
            default: return null;
        }
    };

    const filtered = vouchers.filter(v =>
        v.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.narration?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
                    <p className="text-muted-foreground">Review, verify, and approve vouchers</p>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm p-4">
                <div className="flex items-center gap-2 mb-4 max-w-sm">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search vouchers..."
                        className="flex-1 bg-transparent border-none outline-none text-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b hover:bg-muted/50">
                                <th className="h-12 px-4 font-medium text-muted-foreground">Date</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground">Voucher No</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground">Status</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground">Narration</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground text-right w-[100px]">Amount</th>
                                <th className="h-12 px-4 font-medium text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(v => {
                                const total = v.details.reduce((sum: number, d: any) => sum + d.debitAmount, 0);
                                return (
                                    <tr key={v.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4">{new Date(v.date).toLocaleDateString()}</td>
                                        <td className="p-4 font-mono">{v.voucherNo}</td>
                                        <td className="p-4">{getStatusBadge(v.status)}</td>
                                        <td className="p-4 text-muted-foreground truncate max-w-[200px]">{v.narration}</td>
                                        <td className="p-4 text-right font-medium">{total.toFixed(2)}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/vouchers/${v.id}`)}
                                                    className="p-2 hover:bg-muted rounded-md text-blue-600"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                {v.status === 0 && (
                                                    <button
                                                        onClick={() => handleVerify(v.id)}
                                                        className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
                                                    >
                                                        Verify
                                                    </button>
                                                )}
                                                {v.status === 1 && (
                                                    <button
                                                        onClick={() => handleApprove(v.id)}
                                                        className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-green-700 transition-colors"
                                                    >
                                                        <CheckCircle className="w-3 h-3" /> Approve
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        No vouchers pending approval.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
