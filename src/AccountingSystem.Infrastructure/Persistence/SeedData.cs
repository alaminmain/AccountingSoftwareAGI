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

            // Ensure database is created (optional, usually migrations handle this)
            // context.Database.Migrate(); 

            // 1. Tenants
            if (!await context.Tenants.AnyAsync())
            {
                // We create initial tenants. 
                // Note: BaseEntity.TenantId for a Tenant entity usually refers to itself or 0 (System).
                // We will use 0 for now to indicate "System" or Root.
                context.Tenants.AddRange(
                    new Tenant { Name = "Tenant One", CreatedBy = "System", TenantId = 1, IsActive = true },
                    new Tenant { Name = "Tenant Two", CreatedBy = "System", TenantId = 2, IsActive = true }
                );
                await context.SaveChangesAsync();
            }

            var tenant1 = await context.Tenants.FirstOrDefaultAsync(t => t.Name == "Tenant One");
            var tenant2 = await context.Tenants.FirstOrDefaultAsync(t => t.Name == "Tenant Two");

            int t1Id = tenant1?.Id ?? 1;
            int t2Id = tenant2?.Id ?? 2;

            // 2. Branches
            if (!await context.Branches.AnyAsync())
            {
                context.Branches.AddRange(
                    new Branch { Name = "Head Office T1", Code = "HO-1", TenantId = t1Id, CreatedBy = "System", IsActive = true },
                    new Branch { Name = "Head Office T2", Code = "HO-2", TenantId = t2Id, CreatedBy = "System", IsActive = true }
                );
                await context.SaveChangesAsync();
            }

            var branch1 = await context.Branches.FirstOrDefaultAsync(b => b.TenantId == t1Id);
            var branch2 = await context.Branches.FirstOrDefaultAsync(b => b.TenantId == t2Id);

            // 3. Roles
            string[] roles = { "Admin", "User", "Approver" };
            foreach (var roleName in roles)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new Role { Name = roleName });
                }
            }

            // 4. Users and Employees
            
            // User 1 (Admin for Tenant 1)
            var email1 = "admin1@test.com";
            if (await userManager.FindByEmailAsync(email1) == null)
            {
                var user = new User
                {
                    UserName = email1,
                    Email = email1,
                    EmailConfirmed = true,
                    TenantId = t1Id,
                    BranchId = branch1?.Id,
                    IsTenantAdmin = true,
                    CreatedBy = "System"
                };
                var result = await userManager.CreateAsync(user, "Password@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, "Admin");

                    // Employee for User 1
                    var emp = new Employee
                    {
                        FirstName = "Admin",
                        LastName = "Tenant One",
                        Designation = "System Admin",
                        Department = "IT",
                        UserId = user.Id,
                        TenantId = t1Id,
                        BranchId = branch1?.Id ?? 0,
                        CreatedBy = "System"
                    };
                    context.Employees.Add(emp);
                    await context.SaveChangesAsync();
                }
            }

            // User 2 (Admin for Tenant 2)
            var email2 = "admin2@test.com";
            if (await userManager.FindByEmailAsync(email2) == null)
            {
                var user = new User
                {
                    UserName = email2,
                    Email = email2,
                    EmailConfirmed = true,
                    TenantId = t2Id,
                    BranchId = branch2?.Id,
                    IsTenantAdmin = true,
                    CreatedBy = "System"
                };
                var result = await userManager.CreateAsync(user, "Password@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, "Admin");

                    // Employee for User 2
                    var emp = new Employee
                    {
                        FirstName = "Admin",
                        LastName = "Tenant Two",
                        Designation = "System Admin",
                        Department = "IT",
                        UserId = user.Id,
                        TenantId = t2Id,
                        BranchId = branch2?.Id ?? 0,
                        CreatedBy = "System"
                    };
                    context.Employees.Add(emp);
                    await context.SaveChangesAsync();
                }
            }

            // User 3 (Approver for Tenant 1)
            var email3 = "approver@test.com";
            if (await userManager.FindByEmailAsync(email3) == null)
            {
                var user = new User
                {
                    UserName = email3,
                    Email = email3,
                    EmailConfirmed = true,
                    TenantId = t1Id,
                    BranchId = branch1?.Id,
                    IsTenantAdmin = false,
                    CreatedBy = "System"
                };
                var result = await userManager.CreateAsync(user, "Password@123");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, "Approver");

                    // Employee for Approver
                    var emp = new Employee
                    {
                        FirstName = "Approver",
                        LastName = "Manager",
                        Designation = "Finance Manager",
                        Department = "Finance",
                        UserId = user.Id,
                        TenantId = t1Id,
                        BranchId = branch1?.Id ?? 0,
                        CreatedBy = "System"
                    };
                    context.Employees.Add(emp);
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}
