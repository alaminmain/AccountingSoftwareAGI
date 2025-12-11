namespace AccountingSystem.Application.DTOs.Tenant
{
    public class CreateTenantDto
    {
        public string Name { get; set; } = string.Empty;
    }

    public class TenantDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class CreateBranchDto
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public int TenantId { get; set; }
    }

    public class BranchDto
    {
         public int Id { get; set; }
         public string Name { get; set; } = string.Empty;
         public string Code { get; set; } = string.Empty;
         public int TenantId { get; set; }
    }
}
