using AccountingSystem.Domain.Entities.Common;

namespace AccountingSystem.Domain.Entities
{
    public class Tenant : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? ConnectionString { get; set; } // For future use if Multi-DB
        public bool IsActive { get; set; } = true;
    }
}
