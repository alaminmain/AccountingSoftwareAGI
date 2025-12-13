using AccountingSystem.Domain.Entities.Common;
using AccountingSystem.Domain.Enums;

namespace AccountingSystem.Domain.Entities
{
    public class Voucher : BaseEntity
    {
        public DateTime Date { get; set; }
        public string VoucherNo { get; set; } = string.Empty; // Auto-generated
        public string? ReferenceNo { get; set; }
        public string? Narration { get; set; }
        public string? AttachmentPath { get; set; }
        
        public VoucherType VoucherType { get; set; }
        public VoucherStatus Status { get; set; }
        
        public int BranchId { get; set; }
        public Branch? Branch { get; set; }
        
        public int FiscalYearId { get; set; } // We haven't created FiscalYear yet, but assume it exists or use int for now
        
        // Audit Trail
        public string? VerifiedBy { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public string? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }

        public ICollection<VoucherDetail> Details { get; set; } = new List<VoucherDetail>();
    }
}
