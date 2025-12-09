import { useState } from 'react';
import api from '../api/client';

interface TrialBalanceEntry {
    accountId: number;
    code: string;
    name: string;
    debitTotal: number;
    creditTotal: number;
    isControlAccount: boolean;
    accountLevel: number;
}

interface TrialBalanceReport {
    asOfDate: string;
    entries: TrialBalanceEntry[];
    totalDebit: number;
    totalCredit: number;
}

export const TrialBalance = () => {
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
    const [report, setReport] = useState<TrialBalanceReport | null>(null);

    const handleRunReport = async () => {
        try {
            const res = await api.get(`/Reports/trial-balance?asOfDate=${asOfDate}`);
            setReport(res.data);
        } catch (error) {
            console.error(error);
            alert("Failed to load report");
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Trial Balance</h1>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium mb-1">As Of Date</label>
                    <input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} className="w-full bg-background border border-input rounded px-3 py-2" />
                </div>
                <button
                    onClick={handleRunReport}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium"
                >
                    Run Report
                </button>
            </div>

            {report && (
                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden p-6">
                    <div className="mb-6 text-center border-b pb-4">
                        <h2 className="text-xl font-bold">Trial Balance</h2>
                        <p className="text-muted-foreground">As of {asOfDate}</p>
                    </div>

                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-4 py-2">Code</th>
                                <th className="px-4 py-2">Account</th>
                                <th className="px-4 py-2 text-right">Debit</th>
                                <th className="px-4 py-2 text-right">Credit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {report.entries.map((entry) => (
                                <tr key={entry.accountId} className={entry.isControlAccount ? "bg-muted/10 font-semibold" : ""}>
                                    <td className="px-4 py-2 font-mono text-xs">{entry.code}</td>
                                    <td className="px-4 py-2" style={{ paddingLeft: `${(entry.accountLevel) * 12}px` }}>{entry.name}</td>
                                    <td className="px-4 py-2 text-right">{entry.debitTotal > 0 ? entry.debitTotal.toFixed(2) : '-'}</td>
                                    <td className="px-4 py-2 text-right">{entry.creditTotal > 0 ? entry.creditTotal.toFixed(2) : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-primary/5 font-bold border-t-2 border-primary">
                            <tr>
                                <td colSpan={2} className="px-4 py-3 text-right uppercase">Total</td>
                                <td className="px-4 py-3 text-right">{report.totalDebit.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right">{report.totalCredit.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
};
