import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "AEHA – Autonomous Ethical Hacking Assistant",
  description:
    "Intelligent Penetration Testing Automation, AI Risk Prioritization, and Cryptographic Audit Trail (ITA1405)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased selection:bg-emerald-500 selection:text-black">
        <Navbar />
        <main className="min-h-[calc(100vh-5.5rem)]">{children}</main>
      </body>
    </html>
  );
}
