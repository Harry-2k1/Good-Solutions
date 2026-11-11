import type { Metadata, Viewport } from 'next';
import Providers from '@/components/Providers';
import { THEME_STORAGE_KEY } from '@/theme/theme-config';
import './globals.css';

const themeBootScript = `(()=>{try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);if(t==='light-blue'||t==='dark-blue'||t==='dark'){document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t==='light-blue'?'light':'dark';}else{document.documentElement.dataset.theme='light-blue';document.documentElement.style.colorScheme='light';}}catch(e){document.documentElement.dataset.theme='light-blue';}})();`;

export const metadata: Metadata = {
  title: {
    default: 'Good Solutions | Accountant Admin Portal',
    template: '%s | Good Solutions',
  },
  description:
    'Secure admin portal for accountants managing client tax filing, GST, income tax, and banking details.',
  applicationName: 'Good Solutions',
  authors: [{ name: 'Good Solutions' }],
  keywords: ['accountant', 'admin portal', 'GST', 'tax filing', 'Good Solutions'],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.svg', type: 'image/svg+xml', sizes: '180x180' },
    ],
    shortcut: ['/icon.svg'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Good Solutions',
  },
  openGraph: {
    type: 'website',
    siteName: 'Good Solutions',
    title: 'Good Solutions Admin Portal',
    description: 'Secure accountant admin portal for client and tax management',
    images: [{ url: '/icon.svg', width: 512, height: 512, alt: 'Good Solutions' }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1565C0' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1929' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="light-blue">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
