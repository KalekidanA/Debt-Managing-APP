import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppStateProvider } from "@/lib/state/AppStateContext";
import { TabBar } from "@/components/TabBar";
import { CelebrationOverlay } from "@/components/celebrations/CelebrationOverlay";
import { NotificationManager } from "@/components/notifications/NotificationManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Next.js applies `basePath` automatically to most asset references, but
// not to the `manifest` metadata field, so it's prefixed by hand here.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Zero — Pay off your debt",
  description: "A focused debt payoff coach that helps you build an emergency fund and become debt-free.",
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Zero",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e0c" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AppStateProvider>
          {children}
          <TabBar />
          <CelebrationOverlay />
          <NotificationManager />
        </AppStateProvider>
      </body>
    </html>
  );
}
