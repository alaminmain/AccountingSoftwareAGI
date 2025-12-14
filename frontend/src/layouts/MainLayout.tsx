
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, FileText, Settings, Users, Layers, Paperclip, CheckCircle, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

const SidebarItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to);

    return (
        <Link
            to={to}
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
        >
            <Icon className="w-4 h-4" />
            {label}
        </Link>
    );
};

export const MainLayout = () => {
    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-card flex flex-col">
                <div className="p-6 border-b border-border">
                    <h1 className="text-xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Layers className="w-6 h-6" />
                        AccoPro
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <div className="pt-4 pb-2">
                        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accounting</p>
                    </div>
                    <SidebarItem to="/coa" icon={BookOpen} label="Chart of Accounts" />
                    <SidebarItem to="/vouchers" icon={FileText} label="Vouchers" />
                    <SidebarItem to="/approvals" icon={CheckCircle} label="Approvals" />
                    <SidebarItem to="/subsidiaries" icon={Users} label="Subsidiaries" />

                    <div className="pt-4 pb-2">
                        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reports</p>
                    </div>
                    <SidebarItem to="/reports/ledger" icon={BookOpen} label="Ledger" />
                    <SidebarItem to="/reports/trial-balance" icon={Paperclip} label="Trial Balance" />
                    <SidebarItem to="/reports/balance-sheet" icon={FileText} label="Balance Sheet" />
                    <SidebarItem to="/reports/income-statement" icon={BookOpen} label="Income Statement" />

                    <div className="pt-4 pb-2">
                        <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">System</p>
                    </div>
                    <SidebarItem to="/super-admin" icon={Settings} label="Super Admin" />
                    <SidebarItem to="/users" icon={Shield} label="Users" />
                    <SidebarItem to="/employees" icon={Users} label="Employees" />
                    <SidebarItem to="/settings" icon={Settings} label="Settings" />
                </nav>

                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            AD
                        </div>
                        <div className="text-xs flex-1">
                            <p className="font-medium">Admin User</p>
                            <p className="text-muted-foreground">Head Office</p>
                        </div>
                        <button
                            onClick={() => {
                                localStorage.removeItem('token');
                                localStorage.removeItem('refreshToken');
                                window.location.href = '/login';
                            }}
                            className="text-muted-foreground hover:text-red-500 transition-colors"
                            title="Logout"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-secondary/30">
                <div className="container mx-auto p-6 max-w-7xl">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
