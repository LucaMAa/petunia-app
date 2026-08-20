import request from './client';
import { Activity, ActivityPoint, StartActivityDto } from '../types';

export const activitiesApi = {
  list: () => request<Activity[]>('/activities'),
  get: (id: string) => request<Activity>(`/activities/${id}`),
  start: (dto: StartActivityDto) => request<Activity>('/activities', { method: 'POST', body: dto }),
  appendPoints: (id: string, points: ActivityPoint[]) =>
    request<Activity>(`/activities/${id}/points`, { method: 'POST', body: { points } }),
  pause: (id: string, occurredAt: string) =>
    request<Activity>(`/activities/${id}/pause`, {
      method: 'POST',
      body: { occurred_at: occurredAt },
    }),
  resume: (id: string, occurredAt: string) =>
    request<Activity>(`/activities/${id}/resume`, {
      method: 'POST',
      body: { occurred_at: occurredAt },
    }),
  finish: (id: string, occurredAt: string) =>
    request<Activity>(`/activities/${id}/finish`, {
      method: 'POST',
      body: { occurred_at: occurredAt },
    }),
  cancel: (id: string) => request<void>(`/activities/${id}`, { method: 'DELETE' }),
};
