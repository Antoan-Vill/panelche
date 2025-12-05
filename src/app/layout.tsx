import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';

config.autoAddCss = false;
import { AuthProvider } from "@/lib/firebase/auth-context";
import { SwrProvider } from "@/lib/swr/provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingProvider } from "@/lib/contexts/loading-context";
import { DataSourceProvider } from "@/lib/contexts/data-source-context";
import { I18nProvider } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard",
  description: "A simple dashboard application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <I18nProvider>
            <LoadingProvider>
              <DataSourceProvider>
                <AuthProvider>
                  <SwrProvider>
                    {children}
                  </SwrProvider>
                </AuthProvider>
              </DataSourceProvider>
            </LoadingProvider>
          </I18nProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
