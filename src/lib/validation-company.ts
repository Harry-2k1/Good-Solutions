import { createCompanySchema } from './validation';

export const updateCompanySchema = createCompanySchema.partial().refine(
  (data) =>
    data.name !== undefined ||
    data.description !== undefined ||
    data.companyType !== undefined ||
    data.contacts !== undefined ||
    data.links !== undefined,
  { message: 'At least one field must be provided to update' }
);
