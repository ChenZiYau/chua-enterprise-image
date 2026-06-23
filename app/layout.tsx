import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chua Enterprise — Image Vault",
  description: "Image storage companion for the property-management dashboard.",
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
