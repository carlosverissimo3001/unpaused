import type { Metadata } from 'next';
import { Quicksand } from 'next/font/google';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import './globals.css';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { MotionProvider } from '@/components/providers/MotionProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/ui/OfflineBanner';

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
});

export const metadata: Metadata = {
  title: 'Unpaused - Music Guessing Game',
  description:
    'Test your music knowledge with Unpaused. Guess the song from a snippet of your favorite playlists!',
  keywords: [
    'music',
    'game',
    'spotify',
    'guessing game',
    'music quiz',
    'unpaused',
  ],
  authors: [{ name: 'Unpaused' }],
  creator: 'Unpaused',
  publisher: 'Unpaused',
  applicationName: 'Unpaused',
  appleWebApp: {
    capable: true,
    title: 'Unpaused',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    type: 'website',
    title: 'Unpaused - Music Guessing Game',
    description:
      'Test your music knowledge! Guess the song from a snippet of your favorite playlists.',
    siteName: 'Unpaused',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unpaused - Music Guessing Game',
    description:
      'Test your music knowledge! Guess the song from a snippet of your favorite playlists.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${quicksand.variable} font-sans antialiased max-w-[100vw] overflow-x-hidden`}
      >
        <ErrorBoundary>
          <MotionProvider>
            <QueryProvider>{children}</QueryProvider>
          </MotionProvider>
        </ErrorBoundary>
        <OfflineBanner />
        <Toaster theme="dark" position="bottom-right" />
        <Analytics />
      </body>
    </html>
  );
}
