import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { authConfig } from '@/lib/auth.config';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { UserRole, AccountantModule } from '@/types';
import { loginSchema } from '@/lib/validation';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      organizationId: string;
      moduleAccess: AccountantModule[];
    };
  }

  interface User {
    role: UserRole;
    organizationId: string;
    moduleAccess: AccountantModule[];
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    organizationId: string;
    moduleAccess: AccountantModule[];
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        await connectDB();
        const user = await User.findOne({ email: parsed.data.email, isActive: true }).select(
          '+password'
        );
        if (!user) return null;

        const isValid = await bcrypt.compare(parsed.data.password, user.password);
        if (!isValid) return null;

        const moduleAccess = user.moduleAccess?.length
          ? [...user.moduleAccess]
          : [];

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId.toString(),
          moduleAccess,
        };
      },
    }),
  ],
});
