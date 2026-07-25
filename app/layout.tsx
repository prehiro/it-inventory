import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "IT Inventory",
  description: "Internal IT asset inventory management",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const role = session?.user?.role;
  const name = session?.user?.name ?? "User";

  // Login page renders full-bleed (no shell)
  if (!session?.user) {
    return (
      <html lang="en" className={inter.variable} suppressHydrationWarning>
        <body className="min-h-full bg-slate-50 antialiased dark:bg-slate-950">
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-full bg-slate-50 antialiased dark:bg-slate-950">
        <ThemeProvider>
          <Sidebar role={role!} />
          <div className="pl-60">
            <Topbar name={name} role={role!} />
            <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
