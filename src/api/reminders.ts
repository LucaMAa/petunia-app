import request from "./client";
import {Reminder, CreateReminderDto, UpdateReminderDto} from "../types/reminders";

export const remindersApi = {
  getByFamily: (id : string, petId? : string) => {
    const qs = petId
      ? `?pet_id=${petId}`
      : "";
    return request<Reminder[]>(`/families/${id}/reminders${qs}`);
  },

  create: (dto : CreateReminderDto) => request<Reminder>("/reminders", {
    method: "POST",
    body: dto
  }),

  update: (id : string, dto : UpdateReminderDto) => request<Reminder>(`/reminders/${id}`, {
    method: "PATCH",
    body: dto
  }),

  delete: (id : string) => request<void>(`/reminders/${id}`, {method: "DELETE"}),

  ack: (id : string, occurrenceKey : string) => request < {
    first_ack: boolean;
    message: string
  } > (`/reminders/${id}/ack`, {
    method: "POST",
    body: {
      occurrence_key: occurrenceKey
    }
  })
};
