import type { NextAuthConfig } from 'next-auth';
import { UserRole, AccountantModule } from '@/types';

/**
 * Edge-compatible NextAuth config.
 * Do not import mongoose, bcrypt, or other Node-only modules here.
 * Used by middleware; full providers are added in auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
  },
  trustHost: true,
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role as UserRole;
        token.organizationId = user.organizationId as string;
        token.moduleAccess = user.moduleAccess?.length
          ? [...user.moduleAccess]
          : [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.organizationId = token.organizationId as string;
        session.user.moduleAccess = Array.isArray(token.moduleAccess)
          ? [...token.moduleAccess]
          : [];
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
