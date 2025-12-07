using AccountingSystem.Domain.Entities.Common;

namespace AccountingSystem.Domain.Entities
{
    // Simple mapping for now, or could just be a List<string> Roles on User if we don't need independent Role entity.
    // For scalability, let's make it a value object or entity. 
    // Let's use string based Roles for simplicity as per requirements "Branch admin can assign..." 
    // actually, let's do a join entity.
    
    public class UserRole : BaseEntity
    {
        public int UserId { get; set; }
        public User? User { get; set; }
        
        public string Role { get; set; } = string.Empty; // "Entry", "Verifier", "Approver", "BranchAdmin"
    }
}
