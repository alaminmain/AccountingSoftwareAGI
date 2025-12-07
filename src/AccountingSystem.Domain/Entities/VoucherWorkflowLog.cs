using AccountingSystem.Domain.Entities.Common;
using AccountingSystem.Domain.Enums;

namespace AccountingSystem.Domain.Entities
{
    public class VoucherWorkflowLog : BaseEntity
    {
        public int VoucherId { get; set; }
        public Voucher? Voucher { get; set; }
        
        public VoucherStatus FromStatus { get; set; }
        public VoucherStatus ToStatus { get; set; }
        
        public string ActionBy { get; set; } = string.Empty; // Username/Id
        public DateTime ActionDate { get; set; } = DateTime.UtcNow;
        
        public string? Comment { get; set; }
    }
}
