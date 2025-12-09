# Double Entry Accounting System

## Prerequisites
- **.NET 8 SDK**
- **Node.js** (v18+)
- **PostgreSQL** Database

## Getting Started

### 1. Database Setup
Ensure PostgreSQL is running. The project is configured to use a database named `AccountingDb`.
Update the connection string in `src/AccountingSystem.Api/appsettings.json` if your credentials differ from:
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Database=AccountingDb;Username=postgres;Password=admin"
}
```

### 2. Backend (API)
The backend handles all logic, data seeding, and API endpoints.

1. Navigate to the API directory:
   ```bash
   cd src/AccountingSystem.Api
   ```
2. Apply database migrations (creates the DB and tables):
   ```bash
   dotnet ef database update -p ../AccountingSystem.Infrastructure -s .
   ```
   *Note: This also seeds initial data (Admin user, Default Tenant, COA).*
3. Run the API:
   ```bash
   dotnet run
   ```
   The API will start (usually at `http://localhost:5202`).
   You can view the **Swagger UI** at `http://localhost:5202/swagger/index.html` to test endpoints directly.

### 3. Frontend (React App)
The frontend provides the user interface.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   Access the application at `http://localhost:5173`.

## Features to Test
- **Dashboard**: `http://localhost:5173/dashboard`
- **Chart of Accounts**: `http://localhost:5173/coa` (Try adding a child account).
- **Voucher Entry**: `http://localhost:5173/vouchers` (Create a voucher).
- **Approvals**: `http://localhost:5173/approvals` (Verify and Approve vouchers).
- **Reports**:
  - **Ledger**: `http://localhost:5173/reports/ledger`
  - **Trial Balance**: `http://localhost:5173/reports/trial-balance`

## Login Info (Default Seeded Data)
- **User**: `admin`
- **Password**: `admin123` (Authentication is currently simulated in parts of the frontend)
