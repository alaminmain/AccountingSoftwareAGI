using AccountingSystem.Domain.Entities.Common;

namespace AccountingSystem.Domain.Entities
{
    public class SubsidiaryType : BaseEntity
    {
        public string Name { get; set; } = string.Empty; // e.g. Customer, Vendor, Employee
    }
}
