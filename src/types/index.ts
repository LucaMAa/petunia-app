export type UserStatus = 'enabled' | 'disabled';
export type FamilyRole = 'owner' | 'member';
export type InviteStatus = 'pending' | 'accepted' | 'declined';
export type ReportType = 'poisoned_bait' | 'dog_area' | 'danger' | 'interesting' | 'vet';
export type ReportStatus = 'pending' | 'approved' | 'rejected';
export type ActivityType = 'walk' | 'run' | 'hike' | 'park' | 'free';
export type ActivityStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type ActivityPrivacy = 'private' | 'stats_only' | 'shared';

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
  avatar?: UploadedFile | null;
  created_at: string;
  updated_at: string;
}

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
  avatar?: UploadedFile | null;
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
  avatar_file_id?: string | null;
  avatar?: UploadedFile | null;
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
    last_name: string;
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

export interface ActivityPoint {
  lat: number;
  lng: number;
  recorded_at: string;
  accuracy_m?: number;
}

export interface Activity {
  id: string;
  pet_id?: string | null;
  type: ActivityType;
  status: ActivityStatus;
  privacy: ActivityPrivacy;
  started_at: string;
  ended_at?: string | null;
  paused_at?: string | null;
  paused_duration_s?: number;
  duration_s: number;
  distance_m: number;
  points?: ActivityPoint[];
  pet?: Pet | null;
  created_at: string;
}

export interface StartActivityDto {
  pet_id?: string;
  type: ActivityType;
  privacy: ActivityPrivacy;
  started_at: string;
}
