import { tokenStorage } from './client';
import request from './client';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api';

export interface UploadedFile {
  id: string;
  owner_id: string;
  owner_type: 'pet' | 'user';
  category: 'avatar' | 'document';
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  created_at: string;
  updated_at: string;
}
async function uploadMultipart(
  path: string,
  fileUri: string,
  fileName: string,
  mimeType: string,
): Promise<UploadedFile> {
  const token = await tokenStorage.getAccess();

  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error ?? json.message ?? 'Upload failed');
  }
  return json.data as UploadedFile;
}

export const uploadApi = {
  petAvatar: (petId: string, fileUri: string, fileName: string, mimeType: string) =>
    uploadMultipart(`/upload/avatar/pets/${petId}`, fileUri, fileName, mimeType),
  userAvatar: (fileUri: string, fileName: string, mimeType: string) =>
    uploadMultipart(`/upload/avatar/users/me`, fileUri, fileName, mimeType),
  petDocument: (petId: string, fileUri: string, fileName: string, mimeType: string) =>
    uploadMultipart(`/upload/documents/pets/${petId}`, fileUri, fileName, mimeType),
  listPetDocuments: (petId: string) => request<UploadedFile[]>(`/upload/documents/pets/${petId}`),
  deleteFile: async (fileId: string): Promise<void> => {
    const token = await tokenStorage.getAccess();
    const res = await fetch(`${BASE_URL}/upload/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 204) return;
    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? 'Delete failed');
  },
};
