export type UserStatus = "enabled" | "disabled";
export type FamilyRole = "owner" | "member";
export type InviteStatus = "pending" | "accepted" | "declined";
export type ReportType = | "poisoned_bait" | "dog_area" | "danger" | "interesting" | "vet";
export type ReportStatus = "pending" | "approved" | "rejected";

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

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: UserStatus;
  avatar_file_id?: string | null;
  /** Populated when the backend preloads the Avatar association. */
  avatar?: UploadedFile | null;
  created_at: string;
  updated_at: string;
}

/** Convenience helper — returns the avatar URL or empty string. */
export function userAvatarUrl(user: User): string {
  return user.avatar?.url ?? '';
}

export interface AuthResponse {
  token: string;
  refresh_token: string;
  user: User;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  birth_date: string | null;
  gender: string;
  avatar_file_id?: string | null;
  /** Populated when the backend preloads the Avatar association. */
  avatar?: UploadedFile | null;
  /**
   * avatar_url is still included in API responses as a derived convenience
   * field (built server-side from the joined UploadedFile.PublicURL).
   * Use this for display; use the upload API to change it.
   */
  avatar_url: string;
  owners?: User[];
  created_at: string;
  updated_at: string;
}

export interface ApiEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
export interface RegisterDto {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface UpdateProfileDto {
  first_name: string;
  last_name: string;
}

export interface RequestEmailChangeDto {
  new_email: string;
}

export interface ChangePasswordDto {
  current_password: string;
  new_password: string;
}

export interface CreatePetDto {
  name: string;
  species: string;
  breed?: string;
  birth_date?: string | null;
  gender?: string;
}

export interface UpdatePetDto extends CreatePetDto {}

export interface AddOwnerDto {
  user_id: string;
}

export interface FamilyMember {
  id: number;
  family_id: string;
  user_id: string;
  role: FamilyRole;
  joined_at: string;
  user?: User;
}

export interface Family {
  id: string;
  name: string;
  members?: FamilyMember[];
  created_at: string;
  updated_at: string;
  pets?: Pet[];
}

export interface CreateFamilyDto {
  name: string;
}

export interface InviteMemberDto {
  user_id: string;
}

export interface FamilyInvite {
  id: number;
  family_id: string;
  inviter_id: string;
  invitee_id: string;
  status: InviteStatus;
  created_at: string;
  expires_at: string;
  family?: Family;
  inviter?: User;
}

export interface MapReport {
  id: string;
  user_id: string;
  type: ReportType;
  title: string;
  description: string;
  lat: number;
  lng: number;
  image_urls: string[];
  status: ReportStatus;
  abuse_count: number;
  expires_at: string | null;
  created_at: string;
  distance_m?: number;
  user?: {
    first_name: string;
    last_name: string
  };
}

export interface CreateReportDto {
  type: ReportType;
  title: string;
  description?: string;
  lat: number;
  lng: number;
  image_urls?: string[];
}
