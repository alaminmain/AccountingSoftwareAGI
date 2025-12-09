using AccountingSystem.Domain.Entities.Common;

namespace AccountingSystem.Domain.Entities
{
    public class SubsidiaryLedger : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string? Address { get; set; }
        
        public int SubsidiaryTypeId { get; set; }
        public SubsidiaryType? SubsidiaryType { get; set; }
        
        // Default Control Account (ChartOfAccount) for this sub-ledger
        // This links the sub-ledger to the GL.
        public int ControlAccountId { get; set; }
        public ChartOfAccount? ControlAccount { get; set; }
        
        public bool IsActive { get; set; } = true;
    }
}
