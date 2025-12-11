using AccountingSystem.Domain.Entities;
using AccountingSystem.Domain.Entities.Common;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace AccountingSystem.Infrastructure.Persistence
{
    public class ApplicationDbContext : IdentityDbContext<User, Role, int>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<AccountingSystem.Domain.Entities.Tenant> Tenants { get; set; }
        public DbSet<AccountingSystem.Domain.Entities.Branch> Branches { get; set; }
        public DbSet<AccountingSystem.Domain.Entities.ChartOfAccount> ChartOfAccounts { get; set; }
        public DbSet<AccountingSystem.Domain.Entities.SubsidiaryType> SubsidiaryTypes { get; set; }
        public DbSet<AccountingSystem.Domain.Entities.SubsidiaryLedger> SubsidiaryLedgers { get; set; }
        public DbSet<AccountingSystem.Domain.Entities.Voucher> Vouchers { get; set; }
        public DbSet<AccountingSystem.Domain.Entities.VoucherDetail> VoucherDetails { get; set; }
        public DbSet<AccountingSystem.Domain.Entities.FiscalYear> FiscalYears { get; set; }
        public DbSet<AccountingSystem.Domain.Entities.VoucherWorkflowLog> VoucherWorkflowLogs { get; set; }
        public DbSet<AccountingSystem.Domain.Entities.Employee> Employees { get; set; }
        // User and Role DbSets are included in IdentityDbContext

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // COA Self-referencing relationship
            modelBuilder.Entity<AccountingSystem.Domain.Entities.ChartOfAccount>()
                .HasOne(c => c.Parent)
                .WithMany(c => c.Children)
                .HasForeignKey(c => c.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Voucher Details relationships
            modelBuilder.Entity<AccountingSystem.Domain.Entities.VoucherDetail>()
                 .HasOne(d => d.Voucher)
                 .WithMany(v => v.Details)
                 .HasForeignKey(d => d.VoucherId)
                 .OnDelete(DeleteBehavior.Cascade);
                 
            // Balance check constraint or validation logic will be in Application laye
            
            // Global Filter for Multi-tenancy
            // We will implement this dynamically later or per entity configuration
            
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        }
    }
}
