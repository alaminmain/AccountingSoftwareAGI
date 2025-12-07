using AccountingSystem.Domain.Entities;
using AccountingSystem.Domain.Enums;
using AccountingSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

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
                
                // 5. Seed Basic COA Tree
                // Assets -> Current Assets -> Cash
                var asset = new ChartOfAccount { TenantId = tenant.Id, Name = "Assets", Code = "1000", Type = AccountType.Asset, AccountLevel = 1, IsControlAccount = true };
                var liability = new ChartOfAccount { TenantId = tenant.Id, Name = "Liabilities", Code = "2000", Type = AccountType.Liability, AccountLevel = 1, IsControlAccount = true };
                var equity = new ChartOfAccount { TenantId = tenant.Id, Name = "Equity", Code = "3000", Type = AccountType.Equity, AccountLevel = 1, IsControlAccount = true };
                var revenue = new ChartOfAccount { TenantId = tenant.Id, Name = "Revenue", Code = "4000", Type = AccountType.Revenue, AccountLevel = 1, IsControlAccount = true };
                var expense = new ChartOfAccount { TenantId = tenant.Id, Name = "Expenses", Code = "5000", Type = AccountType.Expense, AccountLevel = 1, IsControlAccount = true };

                context.ChartOfAccounts.AddRange(asset, liability, equity, revenue, expense);
                await context.SaveChangesAsync();

                // Child Accounts
                var cash = new ChartOfAccount { TenantId = tenant.Id, Name = "Cash", Code = "1001", Type = AccountType.Asset, AccountLevel = 2, ParentId = asset.Id, IsControlAccount = false };
                var bank = new ChartOfAccount { TenantId = tenant.Id, Name = "Bank Accounts", Code = "1002", Type = AccountType.Asset, AccountLevel = 2, ParentId = asset.Id, IsControlAccount = false, SubsidiaryTypeId = subTypes.First(s => s.Name == "Bank").Id };
                
                context.ChartOfAccounts.AddRange(cash, bank);
                await context.SaveChangesAsync();
            }
        }
    }
}
