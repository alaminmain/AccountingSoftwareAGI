
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Subsidiaries } from './pages/Subsidiaries';
import { ChartOfAccounts } from './pages/ChartOfAccounts';
import { Vouchers } from './pages/Vouchers';
import { VoucherDashboard } from './pages/VoucherDashboard';
import { Ledger } from './pages/Ledger';
import { TrialBalance } from './pages/TrialBalance';
import { BalanceSheet } from './pages/BalanceSheet';
import { IncomeStatement } from './pages/IncomeStatement';

// Placeholder for Login
const Login = () => <div className="flex h-screen items-center justify-center">Login Page</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="coa" element={<ChartOfAccounts />} />
          <Route path="subsidiaries" element={<Subsidiaries />} />

          <Route path="vouchers" element={<Vouchers />} />
          <Route path="vouchers/:id" element={<Vouchers />} />
          <Route path="approvals" element={<VoucherDashboard />} />
          <Route path="reports/ledger" element={<Ledger />} />
          <Route path="reports/trial-balance" element={<TrialBalance />} />
          <Route path="reports/balance-sheet" element={<BalanceSheet />} />
          <Route path="reports/income-statement" element={<IncomeStatement />} />
          {/* <Route path="settings" element={<Settings />} /> */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
