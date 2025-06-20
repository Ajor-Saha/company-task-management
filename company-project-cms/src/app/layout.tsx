import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import ThemeProviderWrapper from "@/components/header/ThemeProviderWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Company CMS",
  description: "Company CMS Frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" >
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* <ThemeProvider attribute="class" defaultTheme="system" enableSystem> */}
        <ThemeProviderWrapper>
          <main >{children}</main>
          {/* {children} */}
          <Toaster />
        </ThemeProviderWrapper>

        {/* </ThemeProvider> */}
      </body>
    </html>
  );
}
