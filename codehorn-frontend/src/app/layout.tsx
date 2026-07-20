import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'CodeHorn - Sandbox & Coding Platform',
  description: 'A professional platform for coding challenges, sandboxing, and performance evaluations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
