
import type { Metadata } from "next";

// import component

export const metadata: Metadata = {
  title: "Dashboard Module",
  description: "Dashboard Module",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
        {children}
     
    </main>
  );
}