#!/usr/bin/env npx tsx
/**
 * Seed script: creates GOODSOLUTIONS organization and super admin user.
 * Usage: npm run seed
 */
import './load-env';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const MONGODB_URI = process.env.MONGODB_URI;
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@goodsolutions.com';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe@123!';
const SUPER_ADMIN_NAME = process.env.SUPER_ADMIN_NAME || 'Super Admin';

if (!MONGODB_URI) {
  console.error('MONGODB_URI is required');
  process.exit(1);
}

if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 32) {
  console.error('ENCRYPTION_KEY must be at least 32 characters');
  process.exit(1);
}

const OrganizationSchema = new mongoose.Schema({
  name: String,
  slug: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  organizationId: mongoose.Schema.Types.ObjectId,
  moduleAccess: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

async function seed() {
  await mongoose.connect(MONGODB_URI!);

  const Organization = mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);
  const User = mongoose.models.User || mongoose.model('User', UserSchema);

  let org = await Organization.findOne({ slug: 'goodsolutions' });
  if (!org) {
    org = await Organization.create({
      name: 'GOOD SOLUTIONS',
      slug: 'goodsolutions',
    });
    console.log('Created organization: GOOD SOLUTIONS');
  } else {
    console.log('Organization already exists');
  }

  const existing = await User.findOne({ email: SUPER_ADMIN_EMAIL });
  const resetPassword = process.env.SUPER_ADMIN_RESET_PASSWORD === 'true';

  if (existing) {
    if (resetPassword) {
      existing.password = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
      existing.isActive = true;
      await existing.save();
      console.log(`Reset super admin password: ${SUPER_ADMIN_EMAIL}`);
      console.log(`Password: ${SUPER_ADMIN_PASSWORD}`);
    } else {
      console.log(`Super admin already exists: ${SUPER_ADMIN_EMAIL}`);
    }
  } else {
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
    await User.create({
      name: SUPER_ADMIN_NAME,
      email: SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      organizationId: org._id,
    });
    console.log(`Created super admin: ${SUPER_ADMIN_EMAIL}`);
    console.log(`Temporary password: ${SUPER_ADMIN_PASSWORD}`);
    console.log('IMPORTANT: Change this password after first login!');
  }

  if (!process.env.AUTH_SECRET) {
    const secret = crypto.randomBytes(32).toString('hex');
    console.log('\n--- Generate AUTH_SECRET ---');
    console.log(`AUTH_SECRET=${secret}`);
    console.log('Add this to your .env.local file\n');
  }

  await mongoose.disconnect();
  console.log('Seed completed.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
