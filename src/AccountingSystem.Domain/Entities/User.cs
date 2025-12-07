using AccountingSystem.Domain.Entities.Common;

namespace AccountingSystem.Domain.Entities
{
    public class User : BaseEntity
    {
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        
        public int? BranchId { get; set; } // Null if Tenant Admin or works across branches (future scope)
        public Branch? Branch { get; set; }

        public bool IsTenantAdmin { get; set; }

        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }
}
