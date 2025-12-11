using System;
using Microsoft.AspNetCore.Identity;

namespace AccountingSystem.Domain.Entities
{
    public class User : IdentityUser<int>
    {
        // Custom fields
        public int TenantId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? CreatedBy { get; set; }
        public DateTime? LastModifiedAt { get; set; }
        public string? LastModifiedBy { get; set; }

        public int? BranchId { get; set; } // Null if Tenant Admin or works across branches (future scope)
        public AccountingSystem.Domain.Entities.Branch? Branch { get; set; }

        public bool IsTenantAdmin { get; set; }

        // Relationship for IdentityUserRole is managed by IdentityDbContext usually, 
        // but if we have custom UserRole entity we might need to adjust.
        // For now, let's keep it simple and rely on Identity's mechanism or our own if we don't fully use TUserRole.
        
        // We previously had ICollection<UserRole> UserRoles. 
        // Identity has its own way. Let's comment this out for now to avoid confusion 
        // until we decide if we use standard Identity UserRoles or this custom one.
        // public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }
}
