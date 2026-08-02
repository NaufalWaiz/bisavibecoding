import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "bisavibecoding: Lapisan Perencanaan AI untuk Vibe Coding",
    template: "%s: bisavibecoding",
  },
  description:
    "Ubah ide mentah jadi PRD yang matang, lalu jadi task siap tempel ke AI coding agent.",
  applicationName: "bisavibecoding",
  icons: {
    icon: "/icon.svg",
  },
};

import { NavigationProgress } from "@/components/ui/navigation-progress";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased scroll-smooth`}
    >
      <body className="bg-[#F8FAFC] flex min-h-full flex-col text-[#0F172A]">
        <NavigationProgress />
        {children}
        <Toaster />
      </body>
    </html>
  );
}

