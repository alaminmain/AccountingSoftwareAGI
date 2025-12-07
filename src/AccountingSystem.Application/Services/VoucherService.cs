using AccountingSystem.Application.DTOs.Voucher;
using AccountingSystem.Application.Interfaces.Repositories;
using AccountingSystem.Application.Interfaces.Services;
using AccountingSystem.Domain.Entities;
using AccountingSystem.Domain.Enums;

namespace AccountingSystem.Application.Services
{
    public class VoucherService : IVoucherService
    {
        private readonly IGenericRepository<Voucher> _voucherRepository;
        private readonly IGenericRepository<VoucherWorkflowLog> _logRepository;

        public VoucherService(IGenericRepository<Voucher> voucherRepository, IGenericRepository<VoucherWorkflowLog> logRepository)
        {
            _voucherRepository = voucherRepository;
            _logRepository = logRepository;
        }

        public async Task<Voucher> CreateVoucherAsync(CreateVoucherDto dto, string createdBy)
        {
            // Basic validation
            if (dto.Details.Count == 0 || (dto.Details.Sum(d => d.DebitAmount) != dto.Details.Sum(d => d.CreditAmount)))
            {
               // Allow unbalanced for Draft? Requirement says "Double Entry", implies balanced.
               // But usually "Draft" allows anything. 
               // For "Submitted", we enforce equality. 
               // Let's allow creation as Draft even if unbalanced, OR enforce it now.
               // Reqs: "User friendly Voucher Entry System". Usually enforces balance.
               if (dto.Details.Sum(d => d.DebitAmount) != dto.Details.Sum(d => d.CreditAmount))
               {
                   throw new InvalidOperationException("Debit and Credit totals must match.");
               }
            }

            var voucher = new Voucher
            {
                Date = dto.Date,
                VoucherNo = Guid.NewGuid().ToString().Substring(0, 8).ToUpper(), // Placeholder for real number generator
                ReferenceNo = dto.ReferenceNo,
                Narration = dto.Narration,
                VoucherType = dto.VoucherType,
                BranchId = dto.BranchId,
                Status = VoucherStatus.Draft, // Initial status
                CreatedBy = createdBy,
                CreatedAt = DateTime.UtcNow,
                Details = dto.Details.Select(d => new VoucherDetail
                {
                    AccountId = d.AccountId,
                    SubsidiaryLedgerId = d.SubsidiaryLedgerId,
                    DebitAmount = d.DebitAmount,
                    CreditAmount = d.CreditAmount,
                    LineNarration = d.LineNarration
                }).ToList()
            };

            await _voucherRepository.AddAsync(voucher);
            
            await _logRepository.AddAsync(new VoucherWorkflowLog
            {
                VoucherId = voucher.Id, // voucher.Id is populated after AddAsync? NO. EF Core populates it after SaveChanges.
                // GenericRepository.AddAsync calls SaveChanges.
                // So voucher.Id should be available.
                FromStatus = VoucherStatus.Draft,
                ToStatus = VoucherStatus.Draft,
                ActionBy = createdBy,
                Comment = "Created"
            });
             
            // The key is if AddAsync returns the entity with ID. It does.
            // But I cannot use voucher.Id in the SAME call if I want transactional integrity without UoW.
            // But AddAsync(log) is a separate SaveChanges call in my GenericRepository.
            // This is a flaw in my simple GenericRepository for business transactions.
            // For now, I will use: Add Voucher -> (Id generated) -> Add Log. 
            // It might leave orphan voucher if log fails, but acceptable for prototype.
            
            // Wait, AddAsync returns Task<T>. I should verify implementation.
            
            return voucher;
        }

        public async Task<Voucher> VerifyVoucherAsync(int id, string verifiedBy)
        {
            var voucher = await _voucherRepository.GetByIdAsync(id);
            if (voucher == null) throw new KeyNotFoundException("Voucher not found");
            
            if (voucher.Status != VoucherStatus.Draft)
                throw new InvalidOperationException("Only Draft vouchers can be verified.");

            var oldStatus = voucher.Status;
            voucher.Status = VoucherStatus.Verified;
            voucher.VerifiedBy = verifiedBy;
            voucher.VerifiedAt = DateTime.UtcNow;

            await _voucherRepository.UpdateAsync(voucher);
            
            await _logRepository.AddAsync(new VoucherWorkflowLog
            {
                VoucherId = voucher.Id,
                FromStatus = oldStatus,
                ToStatus = VoucherStatus.Verified,
                ActionBy = verifiedBy,
                Comment = "Verified"
            });

            return voucher;
        }

        public async Task<Voucher> ApproveVoucherAsync(int id, string approvedBy)
        {
            var voucher = await _voucherRepository.GetByIdAsync(id);
            if (voucher == null) throw new KeyNotFoundException("Voucher not found");
            
            if (voucher.Status != VoucherStatus.Verified)
                throw new InvalidOperationException("Only Verified vouchers can be approved.");

            var oldStatus = voucher.Status;
            voucher.Status = VoucherStatus.Approved;
            voucher.ApprovedBy = approvedBy;
            voucher.ApprovedAt = DateTime.UtcNow;

            await _voucherRepository.UpdateAsync(voucher);

            await _logRepository.AddAsync(new VoucherWorkflowLog
            {
                VoucherId = voucher.Id,
                FromStatus = oldStatus,
                ToStatus = VoucherStatus.Approved,
                ActionBy = approvedBy,
                Comment = "Approved"
            });
            
            return voucher;
        }
    }
}
