using AccountingSystem.Domain.Entities.Common;
using AccountingSystem.Domain.Enums;

namespace AccountingSystem.Domain.Entities
{
    public class ChartOfAccount : BaseEntity
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public AccountType Type { get; set; }
        public int AccountLevel { get; set; }
        
        // Hierarchy
        public int? ParentId { get; set; }
        public ChartOfAccount? Parent { get; set; }
        public ICollection<ChartOfAccount> Children { get; set; } = new List<ChartOfAccount>();
        
        // Control Account cannot have transactions if it has children, 
        // but typically a control account IS a parent.
        public bool IsControlAccount { get; set; } 
        
        public bool IsActive { get; set; } = true;
    }
}
