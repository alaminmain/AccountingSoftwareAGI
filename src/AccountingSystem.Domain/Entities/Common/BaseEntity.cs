using System;

namespace AccountingSystem.Domain.Entities.Common
{
    public abstract class BaseEntity
    {
        public int Id { get; set; }
        public int TenantId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? CreatedBy { get; set; }
        public DateTime? LastModifiedAt { get; set; }
        public string? LastModifiedBy { get; set; }
    }
}
