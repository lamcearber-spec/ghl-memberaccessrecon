import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MemberAccessRecon - Ghost Access Audit",
  description: "Read-only HighLevel membership access, payment, and subscription reconciliation reports.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
