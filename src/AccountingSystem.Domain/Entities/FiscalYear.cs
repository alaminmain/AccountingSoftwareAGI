using AccountingSystem.Domain.Entities.Common;

namespace AccountingSystem.Domain.Entities
{
    public class FiscalYear : BaseEntity
    {
        public string Name { get; set; } = string.Empty; // e.g. "2024-2025"
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public bool IsClosed { get; set; }
    }
}
