import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Layout/Sidebar";
import Header from "@/components/Layout/Header";

export const metadata: Metadata = {
  title: "AI Alpha Scanner | Early Crypto Project Discovery",
  description: "Discover early-stage crypto projects before they go mainstream",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased noise-overlay">
        <div className="flex min-h-screen grid-bg">
          <Sidebar />
          <main className="flex-1 ml-[260px] relative z-[1]">
            <Header />
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
