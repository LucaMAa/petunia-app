import { CreateReportDto, MapReport } from '../types';
import request from './client';

export const reportsApi = {
  nearby: (lat: number, lng: number, radius = 2000) =>
    request<MapReport[]>(`/reports/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),

  mine: () => request<MapReport[]>('/reports/mine'),

  get: (id: string) => request<MapReport>(`/reports/${id}`),

  create: (dto: CreateReportDto) => request<MapReport>('/reports', { method: 'POST', body: dto }),

  delete: (id: string) => request<void>(`/reports/${id}`, { method: 'DELETE' }),

  reportAbuse: (id: string, reason?: string) =>
    request<void>(`/reports/${id}/abuse`, {
      method: 'POST',
      body: { reason: reason ?? '' },
    }),
};
