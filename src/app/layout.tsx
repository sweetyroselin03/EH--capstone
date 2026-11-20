import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <Navbar />
          <main className="min-h-[calc(100vh-5.5rem)]">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
