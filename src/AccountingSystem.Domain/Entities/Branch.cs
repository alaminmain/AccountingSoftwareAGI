using AccountingSystem.Domain.Entities.Common;

namespace AccountingSystem.Domain.Entities
{
    public class Branch : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Address { get; set; }
        public bool IsActive { get; set; } = true;
        
        // Navigation props if needed, but keeping it simple for now
    }
}
