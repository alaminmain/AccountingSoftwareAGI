using AccountingSystem.Domain.Entities;
using AccountingSystem.Domain.Enums;
using AccountingSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;

namespace AccountingSystem.Infrastructure.Persistence
{
    public static class SeedData
    {
        public static async Task InitializeAsync(ApplicationDbContext context)
        {
            // Ensure database is created
            await context.Database.MigrateAsync();

            // 1. Seed Tenants
            if (!context.Tenants.Any())
            {
                var tenant = new Tenant { Name = "Default Company" };
                context.Tenants.Add(tenant);
                await context.SaveChangesAsync();
                
                // 2. Seed Branches
                var branch = new Branch { TenantId = tenant.Id, Name = "Head Office", Code = "HO" };
                context.Branches.Add(branch);
                await context.SaveChangesAsync();
                
                // 3. Seed Users
                var admin = new User { 
                    TenantId = tenant.Id, 
                    Username = "admin", 
                    PasswordHash = "admin123", // In real app use hashing!
                    BranchId = branch.Id, 
                    IsTenantAdmin = true 
                };
                context.Users.Add(admin);
                await context.SaveChangesAsync();

                // 4. Seed Subsidiary Types
                var subTypes = new List<SubsidiaryType>
                {
                    new SubsidiaryType { TenantId = tenant.Id, Name = "Customer" },
                    new SubsidiaryType { TenantId = tenant.Id, Name = "Vendor" },
                    new SubsidiaryType { TenantId = tenant.Id, Name = "Employee" },
                    new SubsidiaryType { TenantId = tenant.Id, Name = "Bank" }
                };
                context.SubsidiaryTypes.AddRange(subTypes);
                await context.SaveChangesAsync();
                
                // 5. Seed Hierarchy COA Tree
                // Level 1 (Roots)
                var assetLoad = new ChartOfAccount { TenantId = tenant.Id, Name = "Assets", Code = "1", Type = AccountType.Asset, AccountLevel = 1, IsControlAccount = true };
                var liabilityLoad = new ChartOfAccount { TenantId = tenant.Id, Name = "Liabilities", Code = "2", Type = AccountType.Liability, AccountLevel = 1, IsControlAccount = true };
                var equityLoad = new ChartOfAccount { TenantId = tenant.Id, Name = "Equity", Code = "3", Type = AccountType.Equity, AccountLevel = 1, IsControlAccount = true };
                var revenueLoad = new ChartOfAccount { TenantId = tenant.Id, Name = "Revenue", Code = "4", Type = AccountType.Revenue, AccountLevel = 1, IsControlAccount = true };
                var expenseLoad = new ChartOfAccount { TenantId = tenant.Id, Name = "Expenses", Code = "5", Type = AccountType.Expense, AccountLevel = 1, IsControlAccount = true };
                
                context.ChartOfAccounts.AddRange(assetLoad, liabilityLoad, equityLoad, revenueLoad, expenseLoad);
                await context.SaveChangesAsync();

                // Level 2 (Categories)
                var currentAssets = new ChartOfAccount { TenantId = tenant.Id, Name = "Current Assets", Code = "10", Type = AccountType.Asset, AccountLevel = 2, ParentId = assetLoad.Id, IsControlAccount = true };
                var fixedAssets = new ChartOfAccount { TenantId = tenant.Id, Name = "Fixed Assets", Code = "11", Type = AccountType.Asset, AccountLevel = 2, ParentId = assetLoad.Id, IsControlAccount = true };
                var currentLiabilities = new ChartOfAccount { TenantId = tenant.Id, Name = "Current Liabilities", Code = "20", Type = AccountType.Liability, AccountLevel = 2, ParentId = liabilityLoad.Id, IsControlAccount = true };
                var longTermLiabilities = new ChartOfAccount { TenantId = tenant.Id, Name = "Long Term Liabilities", Code = "21", Type = AccountType.Liability, AccountLevel = 2, ParentId = liabilityLoad.Id, IsControlAccount = true };
                var equityCapital = new ChartOfAccount { TenantId = tenant.Id, Name = "Capital Accounts", Code = "30", Type = AccountType.Equity, AccountLevel = 2, ParentId = equityLoad.Id, IsControlAccount = true };
                var operatingRev = new ChartOfAccount { TenantId = tenant.Id, Name = "Operating Revenue", Code = "40", Type = AccountType.Revenue, AccountLevel = 2, ParentId = revenueLoad.Id, IsControlAccount = true };
                var operatingExp = new ChartOfAccount { TenantId = tenant.Id, Name = "Operating Expenses", Code = "50", Type = AccountType.Expense, AccountLevel = 2, ParentId = expenseLoad.Id, IsControlAccount = true };

                context.ChartOfAccounts.AddRange(currentAssets, fixedAssets, currentLiabilities, longTermLiabilities, equityCapital, operatingRev, operatingExp);
                await context.SaveChangesAsync();

                // Level 3 & 4 (Detailed/Transactional)
                var bankType = subTypes.FirstOrDefault(s => s.Name == "Bank");
                var custType = subTypes.FirstOrDefault(s => s.Name == "Customer");
                var vendType = subTypes.FirstOrDefault(s => s.Name == "Vendor");

                // Assets -> Current Assets -> Cash & Bank
                var cashAndBank = new ChartOfAccount { TenantId = tenant.Id, Name = "Cash & Bank", Code = "1001", Type = AccountType.Asset, AccountLevel = 3, ParentId = currentAssets.Id, IsControlAccount = true };
                context.ChartOfAccounts.Add(cashAndBank);
                await context.SaveChangesAsync();

                var cashOnHand = new ChartOfAccount { TenantId = tenant.Id, Name = "Cash on Hand", Code = "100101", Type = AccountType.Asset, AccountLevel = 4, ParentId = cashAndBank.Id, IsControlAccount = false };
                var bankAccount = new ChartOfAccount { TenantId = tenant.Id, Name = "City Bank Main", Code = "100102", Type = AccountType.Asset, AccountLevel = 4, ParentId = cashAndBank.Id, IsControlAccount = false, SubsidiaryTypeId = bankType?.Id };
                
                // Assets -> Current Assets -> Accounts Receivable
                var arAccount = new ChartOfAccount { TenantId = tenant.Id, Name = "Accounts Receivable (Trade)", Code = "100201", Type = AccountType.Asset, AccountLevel = 3, ParentId = currentAssets.Id, IsControlAccount = true, SubsidiaryTypeId = custType?.Id };
                
                // Liabilities -> Current Liabilities -> Accounts Payable
                var apAccount = new ChartOfAccount { TenantId = tenant.Id, Name = "Accounts Payable (Trade)", Code = "200101", Type = AccountType.Liability, AccountLevel = 3, ParentId = currentLiabilities.Id, IsControlAccount = true, SubsidiaryTypeId = vendType?.Id };

                // Equity -> Capital -> Share Capital
                var shareCapital = new ChartOfAccount { TenantId = tenant.Id, Name = "Share Capital", Code = "300101", Type = AccountType.Equity, AccountLevel = 3, ParentId = equityCapital.Id, IsControlAccount = false };

                // Revenue -> Operating -> Sales
                var salesRevenue = new ChartOfAccount { TenantId = tenant.Id, Name = "Sales Revenue", Code = "400101", Type = AccountType.Revenue, AccountLevel = 3, ParentId = operatingRev.Id, IsControlAccount = false };

                // Expenses -> Operating -> Admin -> [Rent, Office]
                var adminExp = new ChartOfAccount { TenantId = tenant.Id, Name = "Administrative Expenses", Code = "5001", Type = AccountType.Expense, AccountLevel = 3, ParentId = operatingExp.Id, IsControlAccount = true };
                context.ChartOfAccounts.Add(adminExp);
                await context.SaveChangesAsync();

                var rentExpense = new ChartOfAccount { TenantId = tenant.Id, Name = "Rent Expense", Code = "500101", Type = AccountType.Expense, AccountLevel = 4, ParentId = adminExp.Id, IsControlAccount = false };
                var officeExpense = new ChartOfAccount { TenantId = tenant.Id, Name = "Office Expense", Code = "500102", Type = AccountType.Expense, AccountLevel = 4, ParentId = adminExp.Id, IsControlAccount = false };

                context.ChartOfAccounts.AddRange(cashOnHand, bankAccount, arAccount, apAccount, shareCapital, salesRevenue, rentExpense, officeExpense);
                await context.SaveChangesAsync();

                // 6. Seed Subsidiary Ledgers (Customers, Vendors)
                if (custType != null && vendType != null)
                {
                    int customerTypeId = custType.Id;
                    int vendorTypeId = vendType.Id;

                    var subLedgers = new List<SubsidiaryLedger>
                    {
                        new SubsidiaryLedger { TenantId = tenant.Id, Name = "John Doe", Code = "CUST001", SubsidiaryTypeId = customerTypeId, ControlAccountId = arAccount.Id },
                        new SubsidiaryLedger { TenantId = tenant.Id, Name = "Jane Smith", Code = "CUST002", SubsidiaryTypeId = customerTypeId, ControlAccountId = arAccount.Id },
                        new SubsidiaryLedger { TenantId = tenant.Id, Name = "Tech Supplies Ltd", Code = "VEND001", SubsidiaryTypeId = vendorTypeId, ControlAccountId = apAccount.Id },
                        new SubsidiaryLedger { TenantId = tenant.Id, Name = "Office Depot", Code = "VEND002", SubsidiaryTypeId = vendorTypeId, ControlAccountId = apAccount.Id }
                    };

                    context.SubsidiaryLedgers.AddRange(subLedgers);
                    await context.SaveChangesAsync();

                    // 7. Seed Fiscal Year
                    var fiscalYear = new FiscalYear 
                    { 
                        TenantId = tenant.Id, 
                        Name = "2024", 
                        StartDate = new DateOnly(2024, 1, 1), 
                        EndDate = new DateOnly(2024, 12, 31), 
                        IsClosed = false 
                    };
                    context.FiscalYears.Add(fiscalYear);
                    await context.SaveChangesAsync();

                    // 8. Generate Mock Vouchers (One Year)
                    var random = new Random();
                    var vouchers = new List<Voucher>();
                    int voucherCounter = 0;

                    // Initial Capital Injection
                    var startCapitalVoucher = new Voucher
                    {
                        TenantId = tenant.Id,
                        Date = new DateTime(2024, 1, 1),
                        VoucherNo = $"JV-{++voucherCounter:D5}",
                        Narration = "Initial Capital Injection",
                        VoucherType = VoucherType.Journal,
                        Status = VoucherStatus.Approved,
                        BranchId = branch.Id,
                        FiscalYearId = fiscalYear.Id,
                        VerifiedBy = admin.Username,
                        VerifiedAt = new DateTime(2024, 1, 1),
                        ApprovedBy = admin.Username,
                        ApprovedAt = new DateTime(2024, 1, 1)
                    };
                    startCapitalVoucher.Details.Add(new VoucherDetail { AccountId = bankAccount.Id, DebitAmount = 500000, CreditAmount = 0, LineNarration = "Bank Deposit" });
                    startCapitalVoucher.Details.Add(new VoucherDetail { AccountId = shareCapital.Id, DebitAmount = 0, CreditAmount = 500000, LineNarration = "Share Capital" });
                    vouchers.Add(startCapitalVoucher);

                    DateTime currentDate = new DateTime(2024, 1, 2);
                    while (currentDate.Year == 2024)
                    {
                        // 1. Monthly Rent (1st of month)
                        if (currentDate.Day == 1)
                        {
                            var rentVal = 5000;
                            var rentVoucher = new Voucher
                            {
                                TenantId = tenant.Id,
                                Date = currentDate,
                                VoucherNo = $"PV-{++voucherCounter:D5}",
                                Narration = $"Rent Payment for {currentDate:MMMM}",
                                VoucherType = VoucherType.Payment,
                                Status = VoucherStatus.Approved,
                                BranchId = branch.Id,
                                FiscalYearId = fiscalYear.Id,
                                VerifiedBy = admin.Username,
                                VerifiedAt = currentDate,
                                ApprovedBy = admin.Username,
                                ApprovedAt = currentDate
                            };
                            rentVoucher.Details.Add(new VoucherDetail { AccountId = rentExpense.Id, DebitAmount = rentVal, CreditAmount = 0 });
                            rentVoucher.Details.Add(new VoucherDetail { AccountId = bankAccount.Id, DebitAmount = 0, CreditAmount = rentVal });
                            vouchers.Add(rentVoucher);
                        }

                        // 2. Random Sales
                        if (random.NextDouble() < 0.3) 
                        {
                            var saleVal = random.Next(1000, 20000);
                            var customer = subLedgers.Where(s => s.SubsidiaryTypeId == customerTypeId).OrderBy(x => random.Next()).First();
                            
                            var saleVoucher = new Voucher
                            {
                                TenantId = tenant.Id,
                                Date = currentDate,
                                VoucherNo = $"JV-{++voucherCounter:D5}",
                                Narration = $"Sales Invoice - {customer.Name}",
                                VoucherType = VoucherType.Journal,
                                Status = VoucherStatus.Approved,
                                BranchId = branch.Id,
                                FiscalYearId = fiscalYear.Id,
                                VerifiedBy = admin.Username,
                                VerifiedAt = currentDate,
                                ApprovedBy = admin.Username,
                                ApprovedAt = currentDate
                            };
                            // Debit AR
                            saleVoucher.Details.Add(new VoucherDetail { AccountId = arAccount.Id, SubsidiaryLedgerId = customer.Id, DebitAmount = saleVal, CreditAmount = 0 });
                            // Credit Revenue
                            saleVoucher.Details.Add(new VoucherDetail { AccountId = salesRevenue.Id, DebitAmount = 0, CreditAmount = saleVal });
                            vouchers.Add(saleVoucher);

                            // Follow up receipt
                            if (random.NextDouble() < 0.8) // 80% pay
                            {
                                var payLag = random.Next(0, 30);
                                var payDate = currentDate.AddDays(payLag);
                                if (payDate.Year == 2024)
                                {
                                    var receiptVoucher = new Voucher
                                    {
                                        TenantId = tenant.Id,
                                        Date = payDate,
                                        VoucherNo = $"RV-{++voucherCounter:D5}",
                                        Narration = $"Payment Received from {customer.Name}",
                                        VoucherType = VoucherType.Receipt,
                                        Status = VoucherStatus.Approved,
                                        BranchId = branch.Id,
                                        FiscalYearId = fiscalYear.Id,
                                        VerifiedBy = admin.Username,
                                        VerifiedAt = payDate,
                                        ApprovedBy = admin.Username,
                                        ApprovedAt = payDate
                                    };
                                    receiptVoucher.Details.Add(new VoucherDetail { AccountId = bankAccount.Id, DebitAmount = saleVal, CreditAmount = 0 });
                                    receiptVoucher.Details.Add(new VoucherDetail { AccountId = arAccount.Id, SubsidiaryLedgerId = customer.Id, DebitAmount = 0, CreditAmount = saleVal });
                                    vouchers.Add(receiptVoucher);
                                }
                            }
                        }

                         // 3. Random Expenses
                        if (random.NextDouble() < 0.1) 
                        {
                            var expVal = random.Next(100, 2000);
                            var vendor = subLedgers.Where(s => s.SubsidiaryTypeId == vendorTypeId).OrderBy(x => random.Next()).First();
                            
                            var expVoucher = new Voucher
                            {
                                TenantId = tenant.Id,
                                Date = currentDate,
                                VoucherNo = $"JV-{++voucherCounter:D5}",
                                Narration = $"Purchase from {vendor.Name}",
                                VoucherType = VoucherType.Journal,
                                Status = VoucherStatus.Approved,
                                BranchId = branch.Id,
                                FiscalYearId = fiscalYear.Id,
                                VerifiedBy = admin.Username,
                                VerifiedAt = currentDate,
                                ApprovedBy = admin.Username,
                                ApprovedAt = currentDate
                            };
                            // Debit Expense
                            expVoucher.Details.Add(new VoucherDetail { AccountId = officeExpense.Id, DebitAmount = expVal, CreditAmount = 0 });
                            // Credit AP
                            expVoucher.Details.Add(new VoucherDetail { AccountId = apAccount.Id, SubsidiaryLedgerId = vendor.Id, DebitAmount = 0, CreditAmount = expVal });
                            vouchers.Add(expVoucher);

                            // Payment to vendor
                            var payLag = random.Next(5, 45);
                            var payDate = currentDate.AddDays(payLag);
                            if (payDate.Year == 2024)
                            {
                                  var paymentVoucher = new Voucher
                                    {
                                        TenantId = tenant.Id,
                                        Date = payDate,
                                        VoucherNo = $"PV-{++voucherCounter:D5}",
                                        Narration = $"Payment to {vendor.Name}",
                                        VoucherType = VoucherType.Payment,
                                        Status = VoucherStatus.Approved,
                                        BranchId = branch.Id,
                                        FiscalYearId = fiscalYear.Id,
                                        VerifiedBy = admin.Username,
                                        VerifiedAt = payDate,
                                        ApprovedBy = admin.Username,
                                        ApprovedAt = payDate
                                    };
                                    paymentVoucher.Details.Add(new VoucherDetail { AccountId = apAccount.Id, SubsidiaryLedgerId = vendor.Id, DebitAmount = expVal, CreditAmount = 0 });
                                    paymentVoucher.Details.Add(new VoucherDetail { AccountId = bankAccount.Id, DebitAmount = 0, CreditAmount = expVal });
                                    vouchers.Add(paymentVoucher);
                            }
                        }

                        currentDate = currentDate.AddDays(1);
                    }

                    context.Vouchers.AddRange(vouchers);
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}
