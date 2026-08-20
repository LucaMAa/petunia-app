import request from './client';
import { Pet, CreatePetDto, UpdatePetDto, AddOwnerDto } from '../types';

export const petsApi = {
  list: () => request<Pet[]>('/pets'),

  get: (id: string) => request<Pet>(`/pets/${id}`),

  create: (dto: CreatePetDto) =>
    request<Pet>('/pets', {
      method: 'POST',
      body: dto,
    }),

  update: (id: string, dto: UpdatePetDto) =>
    request<Pet>(`/pets/${id}`, {
      method: 'PATCH',
      body: dto,
    }),

  delete: (id: string) => request<void>(`/pets/${id}`, { method: 'DELETE' }),

  addOwner: (petId: string, dto: AddOwnerDto) =>
    request<void>(`/pets/${petId}/owners`, {
      method: 'POST',
      body: dto,
    }),

  removeOwner: (petId: string, userId: string) =>
    request<void>(`/pets/${petId}/owners/${userId}`, { method: 'DELETE' }),
};
