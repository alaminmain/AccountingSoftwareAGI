using System.Linq.Expressions;
using AccountingSystem.Application.Interfaces.Repositories;
using AccountingSystem.Domain.Entities.Common;
using AccountingSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace AccountingSystem.Infrastructure.Repositories
{
    public class GenericRepository<T> : IGenericRepository<T> where T : BaseEntity
    {
        protected readonly ApplicationDbContext _context;

        public GenericRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<T?> GetByIdAsync(int id)
        {
            // Simple approach: we need Eager Loading for Vouchers -> Details.
            // But this is a Generic Repo.
            // Override in specialized repo? 
            // Or just allow lazy loading? (LazyLoadingProxies not enabled).
            // Let's rely on manual Include if needed, OR:
            
            // Hack for MVP: if T is Voucher, include Details.
            if (typeof(T) == typeof(AccountingSystem.Domain.Entities.Voucher))
            {
                 return await _context.Set<T>()
                    .Include("Details")
                    .FirstOrDefaultAsync(x => x.Id == id);
            }

            return await _context.Set<T>().FindAsync(id);
        }

        public async Task<IReadOnlyList<T>> GetAllAsync()
        {
            return await _context.Set<T>().ToListAsync();
        }

        public async Task<IReadOnlyList<T>> GetAsync(Expression<Func<T, bool>> predicate)
        {
            return await _context.Set<T>().Where(predicate).ToListAsync();
        }

        public async Task<T> AddAsync(T entity)
        {
            await _context.Set<T>().AddAsync(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task UpdateAsync(T entity)
        {
            _context.Entry(entity).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(T entity)
        {
            _context.Set<T>().Remove(entity);
            await _context.SaveChangesAsync();
        }
    }
}
