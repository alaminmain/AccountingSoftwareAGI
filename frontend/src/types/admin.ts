export interface Tenant {
    id: number;
    name: string;
}

export interface Branch {
    id: number;
    name: string;
    code: string;
    tenantId: number;
}

export interface Employee {
    id: number;
    firstName: string;
    lastName: string;
    designation: string;
    department: string;
    branchId: number;
    branchName?: string;
    userId?: number;
    userName?: string;
}

export interface CreateTenantDto {
    name: string;
}

export interface CreateBranchDto {
    name: string;
    code: string;
    tenantId: number;
}

export interface CreateEmployeeDto {
    firstName: string;
    lastName: string;
    designation: string;
    department: string;
    branchId: number;
    email?: string;
    password?: string;
    roles?: string[];
}
