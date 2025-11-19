// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/contexts/ThemeContext';
import './globals.css';
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Network Data Management System',
  description: 'Excel import and data management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}