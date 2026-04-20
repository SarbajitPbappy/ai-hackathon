import type { ReactNode } from "react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-screen-2xl">
        <Sidebar variant="dashboard" />
        <main className="w-full flex-1 p-4 sm:p-6">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
