import request from './client';
import { User, UpdateProfileDto, RequestEmailChangeDto, ChangePasswordDto } from '../types';

export const profileApi = {
  getProfile: () => request<User>('/profile'),

  updateProfile: (dto: UpdateProfileDto) =>
    request<User>('/profile', {
      method: 'PATCH',
      body: dto,
    }),

  requestEmailChange: (dto: RequestEmailChangeDto) =>
    request<void>('/profile/request-email-change', {
      method: 'POST',
      body: dto,
    }),

  confirmEmailChange: (token: string) =>
    request<void>('/confirm-email', {
      method: 'POST',
      body: {
        token,
      },
      auth: false,
    }),

  changePassword: (dto: ChangePasswordDto) =>
    request<void>('/profile/change-password', {
      method: 'POST',
      body: dto,
    }),

  disableAccount: (password: string) =>
    request<void>('/profile/disable', {
      method: 'POST',
      body: {
        password,
      },
    }),
};
