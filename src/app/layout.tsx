import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'LiveTV Premium — Watch Live Channels Online Free',
  description:
    'Stream live TV channels from Bangladesh, India, Argentina and more. HD quality, sports, news, entertainment — all free via IPTV-Org.',
  keywords: 'live tv, iptv, stream, bangladesh tv, india tv, argentina tv, free streaming, hls',
  openGraph: {
    title: 'LiveTV Premium',
    description: 'Premium live streaming platform powered by IPTV-Org',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📺</text></svg>" />
      </head>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
