export interface Participant {
  id: number;
  uid: string;
  conferenceUid: string;
  userUid?: string | null;
  email?: string | null;
  phone?: string | null;
  displayName: string;
  role: string;
  status: string;
  inviteMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateParticipantDto {
  conferenceUid: string;
  userUid?: string;
  displayName: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  inviteMethod?: string;
}

export type UpdateParticipantDto = Partial<CreateParticipantDto>;