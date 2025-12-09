import { useState } from 'react';
import api from '../api/client';

interface FinancialReportLine {
    accountId: number;
    accountCode: string;
    accountName: string;
    amount: number;
}

interface FinancialStatementSection {
    sectionName: string;
    lines: FinancialReportLine[];
    totalAmount: number;
}

interface FinancialStatement {
    title: string;
    fromDate: string;
    toDate: string;
    sections: FinancialStatementSection[];
    grandTotal: number;
}

export const IncomeStatement = () => {
    const today = new Date().toISOString().split('T')[0];
    // Default to start of month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);

    const [startDate, setStartDate] = useState(startOfMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today);
    const [report, setReport] = useState<FinancialStatement | null>(null);

    const fetchReport = async () => {
        try {
            const response = await api.get('/reports/income-statement', {
                params: { startDate, endDate }
            });
            setReport(response.data);
        } catch (error) {
            console.error('Failed to fetch Income Statement', error);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Income Statement</h1>

            <div className="flex gap-4 items-end bg-card p-4 rounded-lg border shadow-sm">
                <div className="space-y-2">
                    <label className="text-sm font-medium">From Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">To Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>
                <button
                    onClick={fetchReport}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                    Run Report
                </button>
            </div>

            {report && (
                <div className="bg-card rounded-lg border shadow-sm p-6 print:border-none print:shadow-none">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold">{report.title}</h2>
                        <p className="text-muted-foreground">
                            {new Date(report.fromDate).toLocaleDateString()} - {new Date(report.toDate).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="space-y-8">
                        {report.sections.map((section) => (
                            <div key={section.sectionName}>
                                <h3 className="text-lg font-semibold border-b pb-2 mb-4">{section.sectionName}</h3>
                                <table className="w-full text-sm">
                                    <tbody>
                                        {section.lines.map((line) => (
                                            <tr key={line.accountId || line.accountName} className="border-b border-muted/50 hover:bg-muted/50">
                                                <td className="py-2 pl-2 text-muted-foreground w-32">{line.accountCode}</td>
                                                <td className="py-2">{line.accountName}</td>
                                                <td className="py-2 pr-2 text-right font-medium">
                                                    {line.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-muted/30 font-bold">
                                            <td colSpan={2} className="py-3 pl-2">Total {section.sectionName}</td>
                                            <td className="py-3 pr-2 text-right">
                                                {section.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-4 border-t-2 border-primary flex justify-between items-center text-lg font-bold">
                        <span>Net Surplus / (Deficit)</span>
                        <span>{report.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            )}
        </div>
    );
};
