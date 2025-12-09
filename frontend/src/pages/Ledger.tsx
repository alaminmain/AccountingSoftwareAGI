import { useState, useEffect } from 'react';
import api from '../api/client';
import { VoucherModal } from '../components/VoucherModal';
import { Eye } from 'lucide-react';


interface LedgerEntry {
    date: string;
    voucherId: number;
    voucherNo: string;
    narration: string;
    debit: number;
    credit: number;
    runningBalance: number;
}

interface LedgerReport {
    accountName: string;
    accountCode: string;
    openingBalance: number;
    closingBalance: number;
    transactions: LedgerEntry[];
}

interface Account {
    id: number;
    name: string;
    code: string;
}

export const Ledger = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<number>(0);
    const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
    const [report, setReport] = useState<LedgerReport | null>(null);
    const [viewVoucherId, setViewVoucherId] = useState<number | null>(null);

    useEffect(() => {
        api.get('/ChartOfAccounts').then(res => setAccounts(res.data));
    }, []);

    const handleRunReport = async () => {
        if (!selectedAccount) return alert("Select an account");
        try {
            const res = await api.get(`/Reports/ledger?accountId=${selectedAccount}&fromDate=${fromDate}&toDate=${toDate}`);
            setReport(res.data);
        } catch (error) {
            console.error(error);
            alert("Failed to load report");
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Ledger Report</h1>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Account</label>
                    <select
                        value={selectedAccount}
                        onChange={e => setSelectedAccount(Number(e.target.value))}
                        className="w-full bg-background border border-input rounded px-3 py-2"
                    >
                        <option value={0}>Select Account</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">From</label>
                    <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full bg-background border border-input rounded px-3 py-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">To</label>
                    <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full bg-background border border-input rounded px-3 py-2" />
                </div>
                <button
                    onClick={handleRunReport}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium"
                >
                    Run Report
                </button>
            </div>

            {report && (
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden p-6 print:shadow-none print:border-none">
                    <div className="mb-6 text-center border-b pb-4">
                        <h2 className="text-xl font-bold">{report.accountName} ({report.accountCode})</h2>
                        <p className="text-muted-foreground">{fromDate} to {toDate}</p>
                    </div>

                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2">Voucher</th>
                                <th className="px-4 py-2">Narration</th>
                                <th className="px-4 py-2 text-right">Debit</th>
                                <th className="px-4 py-2 text-right">Credit</th>
                                <th className="px-4 py-2 text-right">Balance</th>
                                <th className="px-4 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            <tr className="bg-muted/20 font-semibold italic">
                                <td colSpan={5} className="px-4 py-2">Opening Balance</td>
                                <td className="px-4 py-2 text-right">{report.openingBalance.toFixed(2)}</td>
                                <td></td>
                            </tr>
                            {report.transactions.map((t, i) => (
                                <tr key={i} className="hover:bg-muted/30">
                                    <td className="px-4 py-2">{new Date(t.date).toLocaleDateString()}</td>
                                    <td className="px-4 py-2 font-mono text-xs">{t.voucherNo}</td>
                                    <td className="px-4 py-2">{t.narration}</td>
                                    <td className="px-4 py-2 text-right">{t.debit > 0 ? t.debit.toFixed(2) : '-'}</td>
                                    <td className="px-4 py-2 text-right">{t.credit > 0 ? t.credit.toFixed(2) : '-'}</td>
                                    <td className="px-4 py-2 text-right font-medium">{t.runningBalance.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-center text-muted-foreground hover:text-primary cursor-pointer" onClick={() => setViewVoucherId(t.voucherId)}>
                                        <Eye className="w-4 h-4" />
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-muted/20 font-bold border-t-2 border-primary">
                                <td colSpan={5} className="px-4 py-2">Closing Balance</td>
                                <td className="px-4 py-2 text-right">{report.closingBalance.toFixed(2)}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}

            {viewVoucherId && (
                <VoucherModal voucherId={viewVoucherId} onClose={() => setViewVoucherId(null)} />
            )}
        </div>
    );
};
