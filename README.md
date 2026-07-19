# GOOD SOLUTIONS — Accountant Admin Portal

A secure, server-side Next.js admin portal for accounting firms managing multiple client companies, tax filings, banking credentials, and compliance tasks.

Built for **GOOD SOLUTIONS** to help accountants and managers securely store and manage sensitive client data including GST, Income Tax, TDS, and bank operation credentials.

## Features

### Security First
- **JWT session authentication** via NextAuth.js with 8-hour sessions
- **bcrypt password hashing** (12 rounds) for user credentials
- **AES-256-GCM field-level encryption** for all sensitive data (passwords, PAN, TAN, user IDs)
- **Role-based access control** (RBAC) with hierarchical permissions
- **Masked credentials** by default with explicit reveal action
- **Route protection** via Next.js middleware

### User Roles
| Role | Description | Permissions |
|------|-------------|-------------|
| **Super Admin** | Developer / system owner | Create Admin & Accountant users, full access |
| **Admin** | Manager | Create Accountant users, manage organization |
| **User** | Accountant | Access companies, tasks, credentials |

### Company Management
- Create and list companies/clients (home page)
- Contact details with multiple phones and emails
- Links section with notes
- Task management (open, in progress, completed, on hold)
- **GST**: Login details, E-Way Bill, E-Invoice, Tally credentials
- **Income Tax & TDS**: IT Filing, TDS Payment, TDS Tracers, 26 Bulk Download
- **Bank Operations**: Multiple bank entries with login/transaction passwords
- **Company Login Details**: Portal links and notes

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components & API Routes)
- **Database**: MongoDB with Mongoose ODM
- **UI**: Material UI (MUI) v9
- **Auth**: NextAuth.js v5
- **Validation**: Zod
- **Encryption**: Node.js crypto (AES-256-GCM)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6+ (local or Atlas)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd good

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your values

# Seed super admin user (loads .env.local automatically)
npm run seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your super admin credentials.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `AUTH_SECRET` | Yes | NextAuth secret (min 32 chars) |
| `ENCRYPTION_KEY` | Yes | AES encryption key (min 32 chars) |
| `SUPER_ADMIN_EMAIL` | No | Seed script admin email |
| `SUPER_ADMIN_PASSWORD` | No | Seed script admin password |
| `APP_ENV` | No | `development` or `production` (enables dev features) |
| `NEXTAUTH_URL` | No | App URL (default: localhost:3000) |
| `CORS_ENABLED` | No | Enable CORS in development (default: `true`) |
| `CORS_ORIGIN` | No | Comma-separated allowed origins for CORS |
| `RATE_LIMIT_ENABLED` | No | Enable API rate limiting (default: `true`) |
| `RATE_LIMIT_MAX` | No | Max API requests per IP per window (default: `100`) |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window in ms (default: `60000`) |
| `AUTH_RATE_LIMIT_MAX` | No | Max login/auth requests per IP per window (default: `10`) |

Generate secure secrets:
```bash
openssl rand -base64 32   # For AUTH_SECRET
openssl rand -base64 32   # For ENCRYPTION_KEY
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API
│   ├── api/
│   │   ├── auth/           # NextAuth handlers
│   │   ├── companies/      # Company CRUD & components
│   │   └── users/          # User management
│   ├── companies/          # Company pages
│   ├── login/              # Login page
│   └── users/              # User management page
├── components/
│   ├── common/             # Shared UI components
│   ├── companies/          # Company-specific panels
│   ├── layout/             # Dashboard layout
│   └── pages/              # Page-level components
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   ├── credentials.ts      # Encrypt/decrypt helpers
│   ├── db.ts               # MongoDB connection
│   ├── encryption.ts       # AES-256-GCM encryption
│   ├── permissions.ts      # RBAC helpers
│   └── validation.ts       # Zod schemas
├── models/                 # Mongoose models
├── theme/                  # MUI theme
└── types/                  # TypeScript types
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/companies` | List/create companies |
| GET/PATCH/DELETE | `/api/companies/[id]` | Company details |
| GET/POST/PATCH/DELETE | `/api/companies/[id]/tasks` | Task management |
| GET/PATCH | `/api/companies/[id]/gst` | GST credentials |
| GET/PATCH | `/api/companies/[id]/income-tax` | Income tax credentials |
| GET/POST/PATCH/DELETE | `/api/companies/[id]/bank-operations` | Bank entries |
| GET/POST/PATCH/DELETE | `/api/companies/[id]/login-details` | Portal logins |
| GET/POST | `/api/users` | List/create users |
| GET/PATCH/DELETE | `/api/users/[id]` | User management |

## Security Notes

1. **Never commit** `.env.local` or expose `ENCRYPTION_KEY` / `AUTH_SECRET`
2. Change the default super admin password immediately after first login
3. Sensitive fields are encrypted at rest; decryption requires authenticated API access
4. Credentials are masked in the UI until explicitly revealed
5. Use HTTPS in production
6. Rotate encryption keys with a proper migration strategy if compromised
7. API rate limiting is enabled by default (100 req/min general, 10 req/min for auth). Set `RATE_LIMIT_ENABLED=false` only if needed

## Production Deployment

```bash
npm run build
npm start
```

Ensure all environment variables are set in your hosting platform (Vercel, Docker, etc.).

Set `APP_ENV=production` in production. CORS is disabled automatically outside development.

## Development & CORS

When `APP_ENV=development`, cross-origin requests are allowed for API routes:

- Preflight `OPTIONS` requests are handled in middleware
- Allowed origins are configured via `CORS_ORIGIN` (comma-separated)
- Set `CORS_ENABLED=false` to disable CORS even in development

Example for a separate frontend on port 5173:

```env
APP_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

## License

Proprietary — GOOD SOLUTIONS. All rights reserved.
