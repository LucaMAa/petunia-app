import request from "./client";
import { Family, CreateFamilyDto, InviteMemberDto, User, FamilyInvite } from "../types";

export const familiesApi = {
  list: () => request<Family[]>("/families"),
  get: (id: string) => request<Family>(`/families/${id}`),
  create: (dto: CreateFamilyDto) => request<Family>("/families", {
    method: "POST",
    body: dto
  }),
  update: (id: string, dto: CreateFamilyDto) => request<Family>(`/families/${id}`, {
    method: "PATCH",
    body: dto
  }),
  delete: (id: string) => request<void>(`/families/${id}`, { method: "DELETE" }),
  invite: (id: string, dto: InviteMemberDto) => request<void>(`/families/${id}/members`, {
    method: "POST",
    body: dto
  }),
  removeMember: (id: string, userId: string) => request<void>(`/families/${id}/members/${userId}`, { method: "DELETE" }),
  leave: (id: string) => request<void>(`/families/${id}/leave`, { method: "POST" }),
  searchUsers: (q: string) => request<User[]>(`/families/search/users?q=${encodeURIComponent(q)}`),
  assignPet: (id: string, petId: string) =>
    request<void>(`/families/${id}/pets`, { method: 'POST', body: { pet_id: petId } }),

  unassignPet: (id: string, petId: string) =>
    request<void>(`/families/${id}/pets/${petId}`, { method: 'DELETE' }),

  getPendingInvites: () =>
    request<FamilyInvite[]>('/invites'),

  respondToInvite: (inviteId: number, accepted: boolean) =>
    request<void>('/invites/respond', {
      method: 'POST',
      body: { invite_id: inviteId, accepted },
    }),

  getSentInvites: () =>
    request<FamilyInvite[]>('/invites/sent'),

  cancelInvite: (inviteId: number) =>
    request<void>('/invites', {
      method: 'DELETE',
      body: { invite_id: inviteId },
    }),
};
