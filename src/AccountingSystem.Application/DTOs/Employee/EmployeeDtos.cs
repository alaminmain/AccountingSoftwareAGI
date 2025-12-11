namespace AccountingSystem.Application.DTOs.Employee
{
    public class CreateEmployeeDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Designation { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public int BranchId { get; set; }
        
        // Optional: Create User Login immediately
        public string? Email { get; set; }
        public string? Password { get; set; }
        public List<string> Roles { get; set; } = new();
    }

    public class EmployeeDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Designation { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public int? UserId { get; set; }
        public string? UserName { get; set; }
        public int BranchId { get; set; }
        public string? BranchName { get; set; }
    }
}
