using AccountingSystem.Application.DTOs.Reports;
using AccountingSystem.Application.Interfaces.Services;
using AccountingSystem.Domain.Enums;
using AccountingSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AccountingSystem.Infrastructure.Services
{
    public class ReportingService : IReportingService
    {
        private readonly ApplicationDbContext _context;

        public ReportingService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<LedgerReportDto> GetLedgerAsync(int accountId, DateTime fromDate, DateTime toDate, int tenantId)
        {
            var account = await _context.ChartOfAccounts.FirstOrDefaultAsync(a => a.Id == accountId && a.TenantId == tenantId);
            if (account == null) throw new Exception("Account not found");

            // 1. Calculate Opening Balance
            // Sum of all Debit - Credit before FromDate
            // Note: This logic assumes Asset/Expense are Dr positive, others are Cr positive? 
            // Or usually Ledger matches Dr/Cr side. Let's keep strict Dr - Cr for math.
            
            var preTransactions = await _context.VoucherDetails
                .Include(vd => vd.Voucher)
                .Where(vd => vd.AccountId == accountId && 
                             vd.Voucher.Date < fromDate && 
                             vd.Voucher.Status == VoucherStatus.Approved && // Only Approved Vouchers affect Ledger
                             vd.Voucher.TenantId == tenantId)
                .ToListAsync();

            decimal openingBalance = preTransactions.Sum(t => t.DebitAmount - t.CreditAmount);

            // 2. Fetch Transactions in range
            var transactions = await _context.VoucherDetails
                .Include(vd => vd.Voucher)
                .Where(vd => vd.AccountId == accountId && 
                             vd.Voucher.Date >= fromDate && 
                             vd.Voucher.Date <= toDate && 
                             vd.Voucher.Status == VoucherStatus.Approved &&
                             vd.Voucher.TenantId == tenantId)
                .OrderBy(vd => vd.Voucher.Date)
                .ThenBy(vd => vd.Voucher.VoucherNo)
                .ToListAsync();

            // 3. Transform
            var entries = new List<LedgerEntryDto>();
            decimal runningBalance = openingBalance;

            foreach (var t in transactions)
            {
                runningBalance += (t.DebitAmount - t.CreditAmount);
                entries.Add(new LedgerEntryDto
                {
                    Date = t.Voucher.Date,
                    VoucherId = t.Voucher.Id,
                    VoucherNo = t.Voucher.VoucherNo,
                    Narration = string.IsNullOrEmpty(t.LineNarration) ? t.Voucher.Narration : t.LineNarration,
                    Debit = t.DebitAmount,
                    Credit = t.CreditAmount,
                    RunningBalance = runningBalance
                });
            }

            return new LedgerReportDto
            {
                AccountId = account.Id,
                AccountName = account.Name,
                AccountCode = account.Code,
                FromDate = fromDate,
                ToDate = toDate,
                OpeningBalance = openingBalance,
                Transactions = entries,
                ClosingBalance = runningBalance
            };
        }

        public async Task<TrialBalanceReportDto> GetTrialBalanceAsync(DateTime asOfDate, int tenantId)
        {
            // Fetch all accounts
            var accounts = await _context.ChartOfAccounts
                .Where(a => a.TenantId == tenantId)
                .ToListAsync();

            // Fetch balances for ALL accounts up to date
            // Group by AccountId
            var balances = await _context.VoucherDetails
                .Include(vd => vd.Voucher)
                .Where(vd => vd.Voucher.Date <= asOfDate && 
                             vd.Voucher.Status == VoucherStatus.Approved &&
                             vd.Voucher.TenantId == tenantId)
                .GroupBy(vd => vd.AccountId)
                .Select(g => new { 
                    AccountId = g.Key, 
                    DebitTotal = g.Sum(x => x.DebitAmount), 
                    CreditTotal = g.Sum(x => x.CreditAmount) 
                })
                .ToDictionaryAsync(x => x.AccountId, x => x);

            var reportEntries = new List<TrialBalanceEntryDto>();

            // Basic Logic: Map accounts to DTO, fill balances from dictionary
            // We need a way to Rollup children balances to parents if logic demands " Consolidated TB".
            // Standard TB usually shows Leaf accounts. 
            // If User requested "Multilevel Tree", maybe they want to see Parents too.
            // Let's implement: Leaf Accounts show actual balance. Control Accounts show SUM of children.
            
            // First, map leaf balances
            foreach (var acc in accounts)
            {
                decimal dr = 0;
                decimal cr = 0;

                if (balances.ContainsKey(acc.Id))
                {
                    dr = balances[acc.Id].DebitTotal;
                    cr = balances[acc.Id].CreditTotal;
                }

                reportEntries.Add(new TrialBalanceEntryDto
                {
                    AccountId = acc.Id,
                    Code = acc.Code,
                    Name = acc.Name,
                    AccountLevel = acc.AccountLevel,
                    IsControlAccount = acc.IsControlAccount, // We might need ParentId in DTO to build tree in UI
                    DebitTotal = dr,
                    CreditTotal = cr,
                    NetBalance = dr - cr
                });
            }

            // Calculate Totals
            return new TrialBalanceReportDto
            {
                AsOfDate = asOfDate,
                Entries = reportEntries.OrderBy(e => e.Code).ToList(),
                TotalDebit = reportEntries.Sum(e => e.DebitTotal),
                TotalCredit = reportEntries.Sum(e => e.CreditTotal)
            };
        }


        public async Task<FinancialStatementDto> GetIncomeStatementAsync(DateTime startDate, DateTime endDate, int tenantId)
        {
            // 1. Fetch relevant accounts
            var accounts = await _context.ChartOfAccounts
                .Where(a => a.TenantId == tenantId && (a.Type == AccountType.Revenue || a.Type == AccountType.Expense))
                .ToListAsync();

            // 2. Fetch transactions in range
            var balances = await _context.VoucherDetails
                .Include(vd => vd.Voucher)
                .Where(vd => vd.Voucher.Date >= startDate && 
                             vd.Voucher.Date <= endDate && 
                             vd.Voucher.Status == VoucherStatus.Approved &&
                             vd.Voucher.TenantId == tenantId)
                .GroupBy(vd => vd.AccountId)
                .Select(g => new { 
                    AccountId = g.Key, 
                    DebitSum = g.Sum(x => x.DebitAmount), 
                    CreditSum = g.Sum(x => x.CreditAmount) 
                })
                .ToDictionaryAsync(x => x.AccountId, x => x);

            // 3. Build Sections
            var revenueSection = new FinancialStatementSectionDto { SectionName = "Revenue" };
            var expenseSection = new FinancialStatementSectionDto { SectionName = "Expense" };

            foreach (var acc in accounts)
            {
                decimal dr = balances.ContainsKey(acc.Id) ? balances[acc.Id].DebitSum : 0;
                decimal cr = balances.ContainsKey(acc.Id) ? balances[acc.Id].CreditSum : 0;
                
                decimal amount = 0;
                if (acc.Type == AccountType.Revenue)
                {
                    amount = cr - dr; // Revenue is Credit normal
                    if (amount != 0)
                    {
                        revenueSection.Lines.Add(new FinancialReportLineDto 
                        { 
                            AccountId = acc.Id, 
                            AccountName = acc.Name, 
                            AccountCode = acc.Code, 
                            Amount = amount 
                        });
                        revenueSection.TotalAmount += amount;
                    }
                }
                else if (acc.Type == AccountType.Expense)
                {
                    amount = dr - cr; // Expense is Debit normal
                    if (amount != 0)
                    {
                        expenseSection.Lines.Add(new FinancialReportLineDto 
                        { 
                            AccountId = acc.Id, 
                            AccountName = acc.Name, 
                            AccountCode = acc.Code, 
                            Amount = amount 
                        });
                        expenseSection.TotalAmount += amount;
                    }
                }
            }

            var dto = new FinancialStatementDto
            {
                Title = "Income Statement",
                FromDate = startDate,
                ToDate = endDate,
                Sections = new List<FinancialStatementSectionDto> { revenueSection, expenseSection },
                GrandTotal = revenueSection.TotalAmount - expenseSection.TotalAmount // Net Income
            };
            
            return dto;
        }

        public async Task<FinancialStatementDto> GetBalanceSheetAsync(DateTime asOfDate, int tenantId)
        {
             // 1. Fetch relevant accounts
            var accounts = await _context.ChartOfAccounts
                .Where(a => a.TenantId == tenantId && 
                           (a.Type == AccountType.Asset || a.Type == AccountType.Liability || a.Type == AccountType.Equity))
                .ToListAsync();

            // 2. Fetch balances as of date
            var balances = await _context.VoucherDetails
                .Include(vd => vd.Voucher)
                .Where(vd => vd.Voucher.Date <= asOfDate && 
                             vd.Voucher.Status == VoucherStatus.Approved &&
                             vd.Voucher.TenantId == tenantId)
                .GroupBy(vd => vd.AccountId)
                .Select(g => new { 
                    AccountId = g.Key, 
                    DebitSum = g.Sum(x => x.DebitAmount), 
                    CreditSum = g.Sum(x => x.CreditAmount) 
                })
                .ToDictionaryAsync(x => x.AccountId, x => x);

            // 3. Build Sections
            var assetSection = new FinancialStatementSectionDto { SectionName = "Assets" };
            var liabilitySection = new FinancialStatementSectionDto { SectionName = "Liabilities" };
            var equitySection = new FinancialStatementSectionDto { SectionName = "Equity" };

            foreach (var acc in accounts)
            {
                decimal dr = balances.ContainsKey(acc.Id) ? balances[acc.Id].DebitSum : 0;
                decimal cr = balances.ContainsKey(acc.Id) ? balances[acc.Id].CreditSum : 0;
                
                decimal amount = 0;
                if (acc.Type == AccountType.Asset)
                {
                    amount = dr - cr; 
                    if (amount != 0)
                    {
                        assetSection.Lines.Add(new FinancialReportLineDto 
                        { 
                            AccountId = acc.Id, 
                            AccountName = acc.Name, 
                            AccountCode = acc.Code, 
                            Amount = amount 
                        });
                        assetSection.TotalAmount += amount;
                    }
                }
                else if (acc.Type == AccountType.Liability || acc.Type == AccountType.Equity)
                {
                    amount = cr - dr; 
                     if (amount != 0)
                    {
                        var line = new FinancialReportLineDto 
                        { 
                            AccountId = acc.Id, 
                            AccountName = acc.Name, 
                            AccountCode = acc.Code, 
                            Amount = amount 
                        };
                        
                        if (acc.Type == AccountType.Liability) 
                        {
                            liabilitySection.Lines.Add(line);
                            liabilitySection.TotalAmount += amount;
                        }
                        else 
                        {
                            equitySection.Lines.Add(line);
                            equitySection.TotalAmount += amount;
                        }
                    }
                }
            }

            // 4. Calculate Net Income / Retained Earnings (Dynamic)
            // Query: Sum of (Rev - Exp) for ALL history up to AsOfDate.
            // Note: This matches "Retained Earnings" logic if we assume no prior year close entries cleared the Rev/Exp accounts.
            // If checking specifically for "Current Year Earnings", we would check start of fiscal year.
            // Assuming simplified "All Time" for MVP.
            
            var plBalances = await _context.VoucherDetails
                .Include(vd => vd.Voucher)
                .Include(vd => vd.Account)
                .Where(vd => vd.Voucher.Date <= asOfDate && 
                             vd.Voucher.Status == VoucherStatus.Approved &&
                             vd.Voucher.TenantId == tenantId &&
                             (vd.Account.Type == AccountType.Revenue || vd.Account.Type == AccountType.Expense))
                .GroupBy(vd => vd.Account.Type)
                .Select(g => new { 
                    Type = g.Key, 
                    DebitSum = g.Sum(x => x.DebitAmount), 
                    CreditSum = g.Sum(x => x.CreditAmount) 
                })
                .ToListAsync();

            decimal totalRevenue = 0;
            decimal totalExpense = 0;

            var revGroup = plBalances.FirstOrDefault(x => x.Type == AccountType.Revenue);
            if (revGroup != null) totalRevenue = revGroup.CreditSum - revGroup.DebitSum;

            var expGroup = plBalances.FirstOrDefault(x => x.Type == AccountType.Expense);
            if (expGroup != null) totalExpense = expGroup.DebitSum - expGroup.CreditSum;

            decimal netIncome = totalRevenue - totalExpense;

            // Add to Equity
            if (netIncome != 0)
            {
                equitySection.Lines.Add(new FinancialReportLineDto 
                { 
                    AccountId = 0, 
                    AccountName = "Net Income (Retained Earnings)", 
                    AccountCode = "RE", 
                    Amount = netIncome 
                });
                equitySection.TotalAmount += netIncome;
            }

            var dto = new FinancialStatementDto
            {
                Title = "Balance Sheet",
                AsOfDate = asOfDate,
                Sections = new List<FinancialStatementSectionDto> { assetSection, liabilitySection, equitySection },
                GrandTotal = assetSection.TotalAmount - (liabilitySection.TotalAmount + equitySection.TotalAmount) 
                // Should be 0 if balanced
            };
            
            return dto;
        }
    }
}
