import type { ReactNode } from "react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import PageTransition from "@/components/layout/PageTransition";

export default function ContestLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  );
}
