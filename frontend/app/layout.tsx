import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import NotificationInitializer from "../components/notifications/NotificationInitializer";
import { ToastProvider } from "../components/notifications/ToastContext";
import GoogleTranslate from "../components/LanguageToggle";
import HelpCentre from "../components/GuidedTour";
import { LanguageProvider } from "../context/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LifeOS",
  description: "Your personal productivity and lifestyle hub",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <LanguageProvider>
            <NotificationInitializer />
            {children}
            <GoogleTranslate />
            <HelpCentre />
          </LanguageProvider>
        </ToastProvider>
      </body>
    </html>
  );
}