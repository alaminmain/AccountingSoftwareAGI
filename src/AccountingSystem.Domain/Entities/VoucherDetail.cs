using AccountingSystem.Domain.Entities.Common;

namespace AccountingSystem.Domain.Entities
{
    public class VoucherDetail : BaseEntity
    {
        public int VoucherId { get; set; }
        public Voucher? Voucher { get; set; }
        
        public int AccountId { get; set; }
        public ChartOfAccount? Account { get; set; }
        
        public int? SubsidiaryLedgerId { get; set; }
        public SubsidiaryLedger? SubsidiaryLedger { get; set; }
        
        public decimal DebitAmount { get; set; }
        public decimal CreditAmount { get; set; }
        
        public string? LineNarration { get; set; }
    }
}
