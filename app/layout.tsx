import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth, signOut } from "@/auth";
import Link from "next/link";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IT Inventory",
  description: "Internal IT asset inventory management",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const role = session?.user?.role;

  const nav = [
    { href: "/", label: "Dashboard" },
    ...(role === "ADMIN" ? [{ href: "/master-data", label: "Master Data" }] : []),
    ...(role === "ADMIN" || role === "MANAGER"
      ? [{ href: "/reports", label: "Reports" }]
      : []),
    ...(role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {session?.user && (
          <header className="border-b border-slate-200 bg-white">
            <nav className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
              <span className="font-semibold">IT Inventory</span>
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="text-sm text-slate-600 hover:text-indigo-600">
                  {n.label}
                </Link>
              ))}
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
                className="ml-auto"
              >
                <button className="text-sm text-slate-500 hover:text-rose-600">
                  {session.user.name} ({role}) · Sign out
                </button>
              </form>
            </nav>
          </header>
        )}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
