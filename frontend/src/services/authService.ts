import { api } from './api';
import { User } from '../types/user';

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export const authService = {
  async loginWithGoogle(credential?: string, token?: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/google', { credential, token });
    if (res.data.token) {
      localStorage.setItem('ease_english_token', res.data.token);
    }
    return res.data;
  },

  async loginWithDevTest(name: string, email: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/google', {
      isDevTest: true,
      name,
      email,
    });
    if (res.data.token) {
      localStorage.setItem('ease_english_token', res.data.token);
    }
    return res.data;
  },

  async getMe(): Promise<{ success: boolean; user: User }> {
    const res = await api.get<{ success: boolean; user: User }>('/auth/me');
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('ease_english_token');
    }
  },
};
