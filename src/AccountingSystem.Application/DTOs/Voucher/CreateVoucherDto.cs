using AccountingSystem.Domain.Enums;

namespace AccountingSystem.Application.DTOs.Voucher
{
    public class CreateVoucherDto
    {
        public DateTime Date { get; set; }
        public string? ReferenceNo { get; set; }
        public string? Narration { get; set; }
        public VoucherType VoucherType { get; set; }
        public int BranchId { get; set; }
        public List<CreateVoucherDetailDto> Details { get; set; } = new();
    }

    public class CreateVoucherDetailDto
    {
        public int AccountId { get; set; }
        public int? SubsidiaryLedgerId { get; set; }
        public decimal DebitAmount { get; set; }
        public decimal CreditAmount { get; set; }
        public string? LineNarration { get; set; }
    }
}
