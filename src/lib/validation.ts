import { z } from 'zod';
import { CompanyType, TaskStatus, UserRole, AccountantModule } from '@/types';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(UserRole),
  moduleAccess: z.array(z.nativeEnum(AccountantModule)).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
  moduleAccess: z.array(z.nativeEnum(AccountantModule)).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const overrideSuperAdminPasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters').optional(),
    useEnvPassword: z.boolean().optional(),
  })
  .refine((data) => data.useEnvPassword === true || Boolean(data.newPassword), {
    message: 'New password is required',
    path: ['newPassword'],
  });

export const contactSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  phoneNumbers: z.array(z.string()).default([]),
  emails: z.array(z.string().email()).default([]),
});

export const companyLinkSchema = z.object({
  name: z.string().min(1, 'Link name is required'),
  url: z.string().url('Invalid URL'),
  notes: z.string().optional(),
});

export const taskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.OPEN),
  assignedTo: z.string().optional(),
});

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  description: z.string().optional(),
  companyType: z.nativeEnum(CompanyType),
  contacts: z.array(contactSchema).default([]),
  links: z.array(companyLinkSchema).default([]),
});

export const credentialsSchema = z.object({
  link: z.string().url('Invalid URL').optional().or(z.literal('')),
  username: z.string().optional(),
  password: z.string().optional(),
  panId: z.string().optional(),
  tanId: z.string().optional(),
  userId: z.string().optional(),
});

export const gstLoginSchema = credentialsSchema.extend({
  updatedAt: z.string().optional(),
  expiredAt: z.string().optional(),
});

export const bankOperationSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  link: z.string().url('Invalid URL').optional().or(z.literal('')),
  userId: z.string().optional(),
  loginPassword: z.string().optional(),
  transactionPassword: z.string().optional(),
  otpUsername: z.string().optional(),
  otpPhoneNumber: z.string().optional(),
});

export const companyLoginDetailSchema = z.object({
  portalName: z.string().min(1, 'Portal name is required'),
  links: z.string().optional(),
  description: z.string().optional(),
});
