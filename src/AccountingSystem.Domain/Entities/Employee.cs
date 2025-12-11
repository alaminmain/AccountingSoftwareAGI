using AccountingSystem.Domain.Entities.Common;

namespace AccountingSystem.Domain.Entities
{
    public class Employee : BaseEntity
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Designation { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;

        // Link to Login User (One-to-One usually)
        public int? UserId { get; set; }
        public User? User { get; set; }

        public int BranchId { get; set; }
        public Branch? Branch { get; set; }
    }
}
