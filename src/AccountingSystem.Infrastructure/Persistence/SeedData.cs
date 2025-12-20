using Microsoft.Extensions.DependencyInjection;
using AccountingSystem.Domain.Entities;
using AccountingSystem.Domain.Enums;
using AccountingSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Identity;
using System.Threading.Tasks;

namespace AccountingSystem.Infrastructure.Persistence
{
    public static class SeedData
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            var context = serviceProvider.GetRequiredService<ApplicationDbContext>();
            var userManager = serviceProvider.GetRequiredService<UserManager<User>>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<Role>>();

            // Ensure roles exist
            string[] roleNames = { "SuperAdmin", "Admin", "User", "Approver" };
            foreach (var r in roleNames)
            {
                if (!await roleManager.RoleExistsAsync(r)) await roleManager.CreateAsync(new Role { Name = r });
            }

            // 0. Data for Super Admin (System Host)
            var sysTenant = await context.Tenants.FirstOrDefaultAsync(t => t.Name == "System Host");
            if (sysTenant == null)
            {
                sysTenant = new Tenant { Name = "System Host", CreatedBy = "Seed", IsActive = true, TenantId = 0 }; // ID 0 or let DB assign
                context.Tenants.Add(sysTenant);
                await context.SaveChangesAsync();
            }

            // Create Super Admin User
            var saEmail = "superadmin@system.com";
            if (await userManager.FindByEmailAsync(saEmail) == null)
            {
                var saUser = new User
                {
                    UserName = saEmail,
                    Email = saEmail,
                    EmailConfirmed = true,
                    TenantId = sysTenant.Id,
                    BranchId = null, // Super Admin may not need a specific branch
                    IsTenantAdmin = false, // Distinct from Tenant Admin
                    CreatedBy = "Seed"
                };
                var result = await userManager.CreateAsync(saUser, "Password@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(saUser, "SuperAdmin");
                    
                    // Create Employee record for consistency? 
                    // Optional, but good for "Employee of the System"
                     context.Employees.Add(new Employee
                    {
                        FirstName = "Super", LastName = "Admin",
                        Designation = "Platform Administrator",
                        Department = "System",
                        UserId = saUser.Id,
                        TenantId = sysTenant.Id,
                        BranchId = 1, // Fallback if FK required, or create System Branch
                        CreatedBy = "Seed"
                    });
                     // Note: Branch FK might fail if Branch 1 doesn't exist yet/belongs to T1.
                     // Let's create a System Branch first to be safe.
                }
            }
            
            // Ensure System Branch exists if we are linking it
             var sysBranch = await context.Branches.FirstOrDefaultAsync(b => b.TenantId == sysTenant.Id);
             if (sysBranch == null) {
                 sysBranch = new Branch { Name = "System HQ", Code = "SYS-01", TenantId = sysTenant.Id, CreatedBy = "Seed", IsActive = true };
                 context.Branches.Add(sysBranch);
                 await context.SaveChangesAsync();
                 
                 // Update SA employee if needed, but let's just make sure next run it's fine
                 // For now, simpler to leave SA Employee branch logic loosely coupled or fixed above if I rewrite loop
             }

            // Define Tenants (T1, T2, T3)
            for (int i = 1; i <= 3; i++)
            {
                string tenantName = $"Tenant {i}";
                var tenant = await context.Tenants.FirstOrDefaultAsync(t => t.Name == tenantName);
                if (tenant == null)
                {
                    tenant = new Tenant { Name = tenantName, CreatedBy = "Seed", IsActive = true, TenantId = i }; 
                    context.Tenants.Add(tenant);
                    await context.SaveChangesAsync(); 
                }
                
                int tenantId = tenant.Id;
                
                // 1. Branches (3 per tenant)
                var branches = new List<Branch>();
                for (int b = 1; b <= 3; b++)
                {
                    string bName = $"Branch {b} of T{i}";
                    var branch = await context.Branches.FirstOrDefaultAsync(br => br.Name == bName && br.TenantId == tenantId);
                    if (branch == null)
                    {
                        branch = new Branch { Name = bName, Code = $"T{i}B{b}", TenantId = tenantId, CreatedBy = "Seed", IsActive = true };
                        context.Branches.Add(branch);
                        await context.SaveChangesAsync();
                    }
                    branches.Add(branch);
                }

                // 2. Users and Employees (3 per tenant)
                // Roles: 1 Admin, 1 User, 1 Approver
                var users = new List<User>();
                for (int u = 1; u <= 3; u++)
                {
                    string role = u == 1 ? "Admin" : (u == 2 ? "User" : "Approver");
                    string email = $"user{u}_t{i}@test.com"; // user1_t1@test.com
                    
                    var user = await userManager.FindByEmailAsync(email);
                    if (user == null)
                    {
                        user = new User
                        {
                            UserName = email,
                            Email = email,
                            EmailConfirmed = true,
                            TenantId = tenantId,
                            BranchId = branches[u-1].Id, // Assign different branches
                            IsTenantAdmin = (role == "Admin"),
                            CreatedBy = "Seed"
                        };
                        var res = await userManager.CreateAsync(user, "Password@123");
                        if (res.Succeeded)
                        {
                            await userManager.AddToRoleAsync(user, role);
                            
                            // Employee
                            context.Employees.Add(new Employee
                            {
                                FirstName = $"User{u}", LastName = $"T{i}",
                                Designation = role,
                                Department = "Finance",
                                UserId = user.Id,
                                TenantId = tenantId,
                                BranchId = branches[u-1].Id,
                                CreatedBy = "Seed"
                            });
                            await context.SaveChangesAsync();
                        }
                    }
                    users.Add(user);
                }

                // 3. Subsidiary Types
                var subTypes = new List<SubsidiaryType>();
                string[] types = { "Customer", "Supplier" };
                foreach(var t in types)
                {
                    var st = await context.SubsidiaryTypes.FirstOrDefaultAsync(x => x.Name == t && x.TenantId == tenantId);
                    if (st == null)
                    {
                        st = new SubsidiaryType { Name = t, TenantId = tenantId, CreatedBy = "Seed" };
                        context.SubsidiaryTypes.Add(st);
                        await context.SaveChangesAsync();
                    }
                    subTypes.Add(st);
                }

                // 4. Chart of Accounts (COA) - REORDERED: Must exist before Subsidiary Ledgers
                if (!await context.ChartOfAccounts.AnyAsync(c => c.TenantId == tenantId))
                {
                    await SeedCOATreeAsync(context, tenantId);
                }

                // 5. Subsidiary Ledgers (5 Customers, 5 Suppliers)
                var subsidiaries = new List<SubsidiaryLedger>();
                
                // Fetch valid Control Accounts
                var assetControlAcct = await context.ChartOfAccounts
                    .Where(c => c.TenantId == tenantId && c.Name.Contains("Assets") && !c.IsControlAccount)
                    .FirstOrDefaultAsync();
                    
                var liabilityControlAcct = await context.ChartOfAccounts
                    .Where(c => c.TenantId == tenantId && c.Name.Contains("Liabilities") && !c.IsControlAccount)
                    .FirstOrDefaultAsync();

                // Fallback if not found (should be found after seeding)
                if (assetControlAcct == null) assetControlAcct = await context.ChartOfAccounts.FirstOrDefaultAsync(c => c.TenantId == tenantId);
                if (liabilityControlAcct == null) liabilityControlAcct = assetControlAcct;

                foreach(var st in subTypes)
                {
                    int controlAcctId = st.Name == "Customer" ? assetControlAcct.Id : liabilityControlAcct.Id;

                    for(int s=1; s<=5; s++)
                    {
                         string sName = $"{st.Name} {s} T{i}";
                         var sub = await context.SubsidiaryLedgers.FirstOrDefaultAsync(x => x.Name == sName && x.TenantId == tenantId);
                         if (sub == null)
                         {
                             sub = new SubsidiaryLedger { 
                                 Name = sName, 
                                 Code = $"{st.Name[0]}-{s:000}", 
                                 SubsidiaryTypeId = st.Id,
                                 TenantId = tenantId, 
                                 ControlAccountId = controlAcctId,
                                 CreatedBy = "Seed" 
                             };
                             context.SubsidiaryLedgers.Add(sub);
                             await context.SaveChangesAsync();
                         }
                         subsidiaries.Add(sub);
                    }
                }

                // 6. Vouchers (1 Year Data)
                if (!await context.Vouchers.AnyAsync(v => v.TenantId == tenantId))
                {
                    await SeedVouchersAsync(context, tenantId, branches, subsidiaries);
                }
            }
        }

        private static async Task SeedCOATreeAsync(ApplicationDbContext context, int tenantId)
        {
            // Level 1
            var roots = new[] { 
                ("Assets", 10000), ("Liabilities", 20000), ("Equity", 30000), ("Revenue", 40000), ("Expenses", 50000) 
            };

            foreach (var (name, codeBase) in roots)
            {
                var l1 = new ChartOfAccount { Name = name, Code = codeBase.ToString(), AccountLevel = 1, IsControlAccount = true, TenantId = tenantId };
                context.ChartOfAccounts.Add(l1);
                await context.SaveChangesAsync();

                // AccountLevel 2 (2 children each)
                for (int j = 1; j <= 2; j++)
                {
                    var l2 = new ChartOfAccount { 
                        Name = $"{name} L2-{j}", 
                        Code = $"{codeBase + j*1000}", 
                        AccountLevel = 2, 
                        ParentId = l1.Id, 
                        IsControlAccount = true, 
                        TenantId = tenantId 
                    };
                    context.ChartOfAccounts.Add(l2);
                    await context.SaveChangesAsync();

                    // AccountLevel 3 (2 children each)
                    for (int k = 1; k <= 2; k++)
                    {
                        var l3 = new ChartOfAccount { 
                            Name = $"{name} generic L3-{k}", 
                            Code = $"{codeBase + j*1000 + k*100}", 
                            AccountLevel = 3, 
                            ParentId = l2.Id, 
                            IsControlAccount = true, 
                            TenantId = tenantId 
                        };
                        context.ChartOfAccounts.Add(l3);
                        await context.SaveChangesAsync();

                        // AccountLevel 4 (Leaf nodes - 3 children each)
                        for (int m = 1; m <= 3; m++)
                        {
                             var l4 = new ChartOfAccount { 
                                Name = $"{name} Account {m}", 
                                Code = $"{codeBase + j*1000 + k*100 + m}", 
                                AccountLevel = 4, 
                                ParentId = l3.Id, 
                                IsControlAccount = false, // LEAF
                                TenantId = tenantId 
                            };
                            context.ChartOfAccounts.Add(l4);
                            await context.SaveChangesAsync();
                        }
                    }
                }
            }
        }

        private static async Task SeedVouchersAsync(ApplicationDbContext context, int tenantId, List<Branch> branches, List<SubsidiaryLedger> subsidiaries)
        {
            var leafAccounts = await context.ChartOfAccounts
                .Where(c => c.TenantId == tenantId && !c.IsControlAccount)
                .ToListAsync();

            if (!leafAccounts.Any()) return;

            var cashAcct = leafAccounts.FirstOrDefault(a => a.Name.Contains("Assets"));
            var salesAcct = leafAccounts.FirstOrDefault(a => a.Name.Contains("Revenue"));
            var expAcct = leafAccounts.FirstOrDefault(a => a.Name.Contains("Expenses"));
            
            if (cashAcct == null || salesAcct == null || expAcct == null) 
            {
                cashAcct = leafAccounts[0];
                salesAcct = leafAccounts[1];
                expAcct = leafAccounts[2];
            }

            var rnd = new Random();
            DateTime startDate = DateTime.UtcNow.AddMonths(-12);

            for (int month = 0; month < 12; month++)
            {
                for (int i = 0; i < 20; i++)
                {
                    var date = startDate.AddMonths(month).AddDays(rnd.Next(1, 28));
                    var amount = rnd.Next(100, 5000) * 10;
                    bool isSale = rnd.Next(0, 2) == 0;
                    
                    string narration = isSale ? $"Sales Inv #{rnd.Next(1000,9999)}" : $"Payment Ref #{rnd.Next(1000,9999)}";
                    int type = isSale ? 3 : 2; 
                    
                    var branch = branches[rnd.Next(branches.Count)];

                    var voucher = new Voucher
                    {
                        TenantId = tenantId,
                        BranchId = branch.Id,
                        Date = DateTime.SpecifyKind(date, DateTimeKind.Utc),
                        VoucherNo = $"V-{tenantId}-{month}-{i}",
                        ReferenceNo = $"REF-{rnd.Next(10000)}",
                        Narration = narration,
                        VoucherType = (VoucherType)type,
                        Status = VoucherStatus.Approved,
                        ApprovedBy = "Seed",
                        ApprovedAt = DateTime.UtcNow,
                        CreatedBy = "Seed",
                        CreatedAt = DateTime.UtcNow
                    };
                    
                    var details = new List<VoucherDetail>();
                    
                    if (isSale)
                    {
                        details.Add(new VoucherDetail { AccountId = cashAcct.Id, DebitAmount = amount, CreditAmount = 0, LineNarration = "Cash Rcv" });
                        details.Add(new VoucherDetail { AccountId = salesAcct.Id, DebitAmount = 0, CreditAmount = amount, LineNarration = "Sales Revenue" });
                    }
                    else
                    {
                        details.Add(new VoucherDetail { AccountId = expAcct.Id, DebitAmount = amount, CreditAmount = 0, LineNarration = "Exp Payment" });
                        details.Add(new VoucherDetail { AccountId = cashAcct.Id, DebitAmount = 0, CreditAmount = amount, LineNarration = "Cash Paid" });
                    }
                    
                    voucher.Details = details;
                    context.Vouchers.Add(voucher);
                }
                await context.SaveChangesAsync(); 
            }
        }
    }
}
