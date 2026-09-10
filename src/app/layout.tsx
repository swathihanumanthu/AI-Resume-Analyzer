import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Resume & Job Description Analyzer',
  description: 'Professional AI-powered recruitment analysis tool with transparent ATS scoring, evidence matching, and skill roadmaps.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
