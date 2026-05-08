import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import Navbar from '@/components/Navbar';
import { I18nProvider } from '@/components/I18nProvider';
import { type Lang, dirFor } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Trip.ly — AI Trip Planner',
  description: 'AI trip planner: flights to 150 countries, nearby places, jeep road trips.'
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const c = await cookies();
  const lang: Lang = c.get('lang')?.value === 'en' ? 'en' : 'he';
  return (
    <html lang={lang} dir={dirFor(lang)}>
      <body className="min-h-screen">
        <I18nProvider lang={lang}>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:pt-10 md:pb-12">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
