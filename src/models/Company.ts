import mongoose, { Schema, Document, Model } from 'mongoose';
import { CompanyType, TaskStatus } from '@/types';

const ContactSchema = new Schema(
  {
    name: { type: String, required: true },
    phoneNumbers: [{ type: String }],
    emails: [{ type: String }],
  },
  { _id: true }
);

const CompanyLinkSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    notes: { type: String },
  },
  { _id: true }
);

const TaskSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    startTime: { type: Date },
    endTime: { type: Date },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.OPEN,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const CredentialFieldsSchema = new Schema(
  {
    username: { type: String },
    password: { type: String },
    panId: { type: String },
    tanId: { type: String },
    userId: { type: String },
    updatedAt: { type: Date },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    expiredAt: { type: Date },
  },
  { _id: false }
);

const BankOperationSchema = new Schema(
  {
    bankName: { type: String, required: true },
    userId: { type: String },
    loginPassword: { type: String },
    transactionPassword: { type: String },
    otpUsername: { type: String },
    otpPhoneNumber: { type: String },
  },
  { _id: true }
);

const CompanyLoginDetailSchema = new Schema(
  {
    portalName: { type: String, required: true },
    links: { type: String },
    description: { type: String },
  },
  { _id: true }
);

export interface ICompany extends Document {
  name: string;
  description?: string;
  companyType: CompanyType;
  contacts: Array<{
    _id?: mongoose.Types.ObjectId;
    name: string;
    phoneNumbers: string[];
    emails: string[];
  }>;
  links: Array<{
    _id?: mongoose.Types.ObjectId;
    name: string;
    url: string;
    notes?: string;
  }>;
  tasks: Array<{
    _id?: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    status: TaskStatus;
    assignedTo?: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
  }>;
  gst: {
    loginDetails: Record<string, unknown>;
    ewayBill: Record<string, unknown>;
    eInvoiceBill: Record<string, unknown>;
    tallyEInvoice: Record<string, unknown>;
  };
  incomeTax: {
    itFiling: Record<string, unknown>;
    tdsPayment: Record<string, unknown>;
    tdsTracers: Record<string, unknown>;
    bulkDownload: Record<string, unknown>;
  };
  bankOperations: Array<Record<string, unknown>>;
  companyLoginDetails: Array<Record<string, unknown>>;
  organizationId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    companyType: {
      type: String,
      enum: Object.values(CompanyType),
      required: true,
    },
    contacts: [ContactSchema],
    links: [CompanyLinkSchema],
    tasks: [TaskSchema],
    gst: {
      loginDetails: { type: CredentialFieldsSchema, default: {} },
      ewayBill: { type: CredentialFieldsSchema, default: {} },
      eInvoiceBill: { type: CredentialFieldsSchema, default: {} },
      tallyEInvoice: { type: CredentialFieldsSchema, default: {} },
    },
    incomeTax: {
      itFiling: { type: CredentialFieldsSchema, default: {} },
      tdsPayment: { type: CredentialFieldsSchema, default: {} },
      tdsTracers: { type: CredentialFieldsSchema, default: {} },
      bulkDownload: { type: CredentialFieldsSchema, default: {} },
    },
    bankOperations: [BankOperationSchema],
    companyLoginDetails: [CompanyLoginDetailSchema],
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CompanySchema.index({ organizationId: 1, name: 1 });
CompanySchema.index({ organizationId: 1, isActive: 1 });

export const Company: Model<ICompany> =
  mongoose.models.Company ?? mongoose.model<ICompany>('Company', CompanySchema);
