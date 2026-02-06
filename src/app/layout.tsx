import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CP Calculator Pro",
  description: "Advanced Cathodic Protection Calculation System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={cn(outfit.className, "bg-slate-950 text-slate-100 antialiased min-h-screen")}>
        {children}
      </body>
    </html>
  );
}
