export type UserRole = 'admin' | 'employee';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface EmployeeCreate {
  full_name: string;
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
