export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum TaskStatus {
  OPEN = 'open',
  IN_PROGRESS = 'inprogress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
}

export enum CompanyType {
  PROPRIETORSHIP = 'proprietorship',
  PARTNERSHIP = 'partnership',
  PRIVATE_LIMITED = 'private_limited',
  PUBLIC_LIMITED = 'public_limited',
  LLP = 'llp',
  TRUST = 'trust',
  OTHER = 'other',
}

export interface Contact {
  name: string;
  phoneNumbers: string[];
  emails: string[];
}

export interface CompanyLink {
  name: string;
  url: string;
  notes?: string;
}

export interface TaskItem {
  _id?: string;
  name: string;
  description?: string;
  startTime?: Date | string;
  endTime?: Date | string;
  status: TaskStatus;
  assignedTo?: string;
  createdBy: string;
  createdAt: Date | string;
}

export interface EncryptedCredentials {
  username?: string;
  password?: string;
  panId?: string;
  tanId?: string;
  userId?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
}
