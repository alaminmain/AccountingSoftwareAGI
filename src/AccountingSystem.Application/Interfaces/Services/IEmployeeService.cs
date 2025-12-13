using AccountingSystem.Application.DTOs.Employee;

namespace AccountingSystem.Application.Interfaces.Services
{
    public interface IEmployeeService
    {
        Task<EmployeeDto> CreateEmployeeAsync(CreateEmployeeDto dto, int tenantId);
        Task<IEnumerable<EmployeeDto>> GetEmployeesAsync(int tenantId);
        Task<EmployeeDto> GetEmployeeByIdAsync(int id);
        Task UpdateEmployeeAsync(int id, CreateEmployeeDto dto);
        Task DeleteEmployeeAsync(int id);
    }
}
