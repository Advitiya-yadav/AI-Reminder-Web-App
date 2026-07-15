import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { startTaskScheduler } from '@/lib/taskScheduler';
import { ToastProvider } from '@/components/ui/ToastProvider';

const taskSchedulerStarted = globalThis as typeof globalThis & { __taskSchedulerStarted?: boolean };

if (!taskSchedulerStarted.__taskSchedulerStarted) {
  taskSchedulerStarted.__taskSchedulerStarted = true;
  startTaskScheduler();
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Promptly",
  description: "Your warm reminders",
};
// Set site icons to the promptly logo (place your files under public/promptly_logo/)
export const icons = {
  icon: '/promptly_logo.png',
  apple: '/promptly_logo.png',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
