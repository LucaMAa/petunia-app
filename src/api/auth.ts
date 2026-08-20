import request, { tokenStorage } from './client';
import { AuthResponse, RegisterDto, LoginDto, ChangePasswordDto } from '../types';

export const authApi = {
  register: (dto: RegisterDto) =>
    request<void>('/auth/register', {
      method: 'POST',
      body: dto,
      auth: false,
    }),

  login: async (dto: LoginDto): Promise<AuthResponse> => {
    const data = await request<{
      token: string;
      refresh_token: string;
      user: AuthResponse['user'];
    }>('/auth/login', {
      method: 'POST',
      body: dto,
      auth: false,
    });
    await tokenStorage.setAccess(data.token);
    await tokenStorage.setRefresh(data.refresh_token);
    return data as unknown as AuthResponse;
  },

  refresh: async (): Promise<AuthResponse> => {
    const refresh_token = await tokenStorage.getRefresh();
    if (!refresh_token) throw new Error('No refresh token');
    const data = await request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: {
        refresh_token,
      },
      auth: false,
    });
    await tokenStorage.setAccess(data.token);
    await tokenStorage.setRefresh(data.refresh_token);
    return data;
  },

  logout: async (): Promise<void> => {
    const refresh_token = await tokenStorage.getRefresh();
    try {
      await request<void>('/auth/logout', {
        method: 'POST',
        body: {
          refresh_token,
        },
      });
    } finally {
      await tokenStorage.clear();
    }
  },

  requestPasswordReset: (email: string) =>
    request<void>('/auth/request-reset', {
      method: 'POST',
      body: {
        email,
      },
      auth: false,
    }),

  resetPassword: (token: string, new_password: string) =>
    request<void>('/auth/reset-password', {
      method: 'POST',
      body: {
        token,
        new_password,
      },
      auth: false,
    }),

  changePassword: (dto: ChangePasswordDto) =>
    request<void>('/auth/change-password', {
      method: 'POST',
      body: dto,
    }),
};
