using AccountingSystem.Application.DTOs.Voucher;
using AccountingSystem.Application.Interfaces.Services;
using AccountingSystem.Domain.Entities;
using AccountingSystem.Domain.Enums;
using AccountingSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace AccountingSystem.Infrastructure.Services
{
    public class VoucherService : IVoucherService
    {
        private readonly ApplicationDbContext _context;

        public VoucherService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Voucher> CreateVoucherNewAsync(CreateVoucherDto dto, string createdBy, Stream? attachment = null, string? attachmentName = null)
        {
            // Get the branch to determine tenant and fiscal year
            var branch = await _context.Branches
                .FirstOrDefaultAsync(b => b.Id == dto.BranchId)
                ?? throw new ArgumentException("Branch not found");

            // Generate voucher number (simplified - you may want to implement a more sophisticated numbering system)
            var voucherCount = await _context.Vouchers
                .Where(v => v.BranchId == dto.BranchId && v.VoucherType == dto.VoucherType)
                .CountAsync();
            var voucherNo = $"{dto.VoucherType}-{branch.Code}-{DateTime.Now.Year}-{(voucherCount + 1):D6}";

            string? attachmentPath = null;
            if (attachment != null && !string.IsNullOrEmpty(attachmentName))
            {
                var ext = Path.GetExtension(attachmentName).ToLowerInvariant();
                if (ext != ".pdf" && ext != ".jpg" && ext != ".jpeg" && ext != ".png")
                {
                    throw new ArgumentException("Only PDF and Image files are allowed for attachments.");
                }

                var fileName = $"{Guid.NewGuid()}{ext}";
                var uploadDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "vouchers");
                Directory.CreateDirectory(uploadDir);
                var filePath = Path.Combine(uploadDir, fileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await attachment.CopyToAsync(fileStream);
                }
                attachmentPath = $"/uploads/vouchers/{fileName}";
            }

            var voucher = new Voucher
            {
                Date = dto.Date,
                VoucherNo = voucherNo,
                ReferenceNo = dto.ReferenceNo,
                Narration = dto.Narration,
                VoucherType = dto.VoucherType,
                Status = VoucherStatus.Draft,
                BranchId = dto.BranchId,
                FiscalYearId = 1, // TODO: Implement fiscal year logic
                CreatedBy = createdBy,
                CreatedAt = DateTime.UtcNow,
                AttachmentPath = attachmentPath,
                Details = dto.Details.Select(d => new VoucherDetail
                {
                    AccountId = d.AccountId,
                    SubsidiaryLedgerId = d.SubsidiaryLedgerId,
                    DebitAmount = d.DebitAmount,
                    CreditAmount = d.CreditAmount,
                    LineNarration = d.LineNarration,
                    CreatedBy = createdBy,
                    CreatedAt = DateTime.UtcNow
                }).ToList()
            };

            _context.Vouchers.Add(voucher);
            await _context.SaveChangesAsync();

            return voucher;
        }

        public async Task<Voucher> VerifyVoucherAsync(int id, string verifiedBy)
        {
            var voucher = await _context.Vouchers
                .FirstOrDefaultAsync(v => v.Id == id)
                ?? throw new ArgumentException("Voucher not found");

            if (voucher.Status != VoucherStatus.Draft)
            {
                throw new InvalidOperationException("Only draft vouchers can be verified");
            }

            voucher.Status = VoucherStatus.Verified;
            voucher.VerifiedBy = verifiedBy;
            voucher.VerifiedAt = DateTime.UtcNow;
            voucher.LastModifiedBy = verifiedBy;
            voucher.LastModifiedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return voucher;
        }

        public async Task<Voucher> ApproveVoucherAsync(int id, string approvedBy)
        {
            var voucher = await _context.Vouchers
                .FirstOrDefaultAsync(v => v.Id == id)
                ?? throw new ArgumentException("Voucher not found");

            if (voucher.Status != VoucherStatus.Verified)
            {
                throw new InvalidOperationException("Only verified vouchers can be approved");
            }

            voucher.Status = VoucherStatus.Approved;
            voucher.ApprovedBy = approvedBy;
            voucher.ApprovedAt = DateTime.UtcNow;
            voucher.LastModifiedBy = approvedBy;
            voucher.LastModifiedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return voucher;
        }

        public async Task<IEnumerable<Voucher>> GetAllVouchersAsync(int tenantId)
        {
            return await _context.Vouchers
                .Include(v => v.Branch)
                .Include(v => v.Details)
                    .ThenInclude(d => d.Account)
                .Where(v => v.Branch!.TenantId == tenantId)
                .OrderByDescending(v => v.Date)
                .ToListAsync();
        }

        public async Task<Voucher> UpdateVoucherAsync(int id, CreateVoucherDto dto, string updatedBy)
        {
            var voucher = await _context.Vouchers
                .Include(v => v.Details)
                .FirstOrDefaultAsync(v => v.Id == id)
                ?? throw new ArgumentException("Voucher not found");

            if (voucher.Status != VoucherStatus.Draft)
            {
                throw new InvalidOperationException("Only draft vouchers can be updated");
            }

            voucher.Date = dto.Date;
            voucher.ReferenceNo = dto.ReferenceNo;
            voucher.Narration = dto.Narration;
            voucher.VoucherType = dto.VoucherType;
            voucher.BranchId = dto.BranchId;
            voucher.LastModifiedBy = updatedBy;
            voucher.LastModifiedAt = DateTime.UtcNow;

            // Remove existing details
            _context.VoucherDetails.RemoveRange(voucher.Details);

            // Add new details
            voucher.Details = dto.Details.Select(d => new VoucherDetail
            {
                AccountId = d.AccountId,
                SubsidiaryLedgerId = d.SubsidiaryLedgerId,
                DebitAmount = d.DebitAmount,
                CreditAmount = d.CreditAmount,
                LineNarration = d.LineNarration,
                CreatedBy = updatedBy,
                CreatedAt = DateTime.UtcNow
            }).ToList();

            await _context.SaveChangesAsync();

            return voucher;
        }

        public async Task<Voucher?> GetVoucherByIdAsync(int id)
        {
            return await _context.Vouchers
                .Include(v => v.Branch)
                .Include(v => v.Details)
                    .ThenInclude(d => d.Account)
                .Include(v => v.Details)
                    .ThenInclude(d => d.SubsidiaryLedger)
                .FirstOrDefaultAsync(v => v.Id == id);
        }
    }
}
