import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Deal Structurer',
  description: 'M&A deal structuring tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-800 antialiased">{children}</body>
    </html>
  );
}
