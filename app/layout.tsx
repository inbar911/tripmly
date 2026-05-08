import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Trip.ly — AI Trip Planner',
  description: 'Plan flights, nearby adventures, and road trips with AI. 150 countries, real airline links, your personal travel assistant.'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:pt-10">{children}</main>
      </body>
    </html>
  );
}
