// app/layout.tsx
import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Alexon Group | Employee of the Month",
  description:
    "Internal voting system for Alexon Group Employee of the Month recognition",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-dark-950 text-dark-50 antialiased">
        {children}
      </body>
    </html>
  );
}
