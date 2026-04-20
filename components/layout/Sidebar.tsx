"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  BarChart3,
  BookOpenCheck,
  ClipboardList,
  Gavel,
  LayoutDashboard,
  Medal,
  Shield,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarVariant = "dashboard" | "admin";

type SidebarItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

const dashboardItems: SidebarItem[] = [
  { label: "My Contests", href: "/dashboard", icon: LayoutDashboard },
  { label: "Submissions", href: "/contests", icon: ClipboardList },
  { label: "Rating", href: "/dashboard?tab=rating", icon: Medal },
  { label: "Profile", href: "/profile/me", icon: Users },
];

const adminItems: SidebarItem[] = [
  { label: "Contests", href: "/admin/contests", icon: Shield },
  { label: "Problems", href: "/admin/contests", icon: BookOpenCheck },
  { label: "Participants", href: "/admin/participants", icon: Users },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Judges", href: "/admin/judges", icon: Gavel },
];

export default function Sidebar({ variant = "dashboard" }: { variant?: SidebarVariant }) {
  const pathname = usePathname();
  const items = variant === "admin" ? adminItems : dashboardItems;

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-surface md:block">
      <div className="p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {variant === "admin" ? "Admin Panel" : "Participant Hub"}
        </p>
      </div>
      <nav className="space-y-1 px-3 pb-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-background hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
