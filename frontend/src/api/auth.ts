import { apiClient } from './axios';
import { TokenResponse, User, EmployeeCreate } from '../types/auth';

/**
 * Login using OAuth2 Password Form Data (application/x-www-form-urlencoded).
 * Email goes in username field.
 */
export async function loginApi(email: string, password: string): Promise<TokenResponse> {
  const formData = new URLSearchParams();
  formData.append('username', email.trim());
  formData.append('password', password);

  const response = await apiClient.post<TokenResponse>('/api/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
}

/**
 * Get currently authenticated user.
 */
export async function getMeApi(): Promise<User> {
  const response = await apiClient.get<User>('/api/auth/me');
  return response.data;
}

/**
 * Admin creates a new employee account.
 */
export async function createEmployeeApi(data: EmployeeCreate): Promise<User> {
  const response = await apiClient.post<User>('/api/auth/create-employee', data);
  return response.data;
}
