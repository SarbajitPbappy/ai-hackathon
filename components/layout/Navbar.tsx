"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, Search, UserCircle2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type NavbarProps = {
  showSearch?: boolean;
};

export default function Navbar({ showSearch = true }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [query, setQuery] = useState("");

  const onSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const onSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) {
      return;
    }

    router.push(`/contests?search=${encodeURIComponent(query.trim())}`);
  };

  const onLogoClick = pathname?.startsWith("/admin") ? "/admin/contests" : "/contests";

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center gap-3 px-4 sm:px-6">
        <Link href={onLogoClick} className="shrink-0 text-lg font-semibold tracking-tight">
          <span className="text-accent">Code</span>Arena
        </Link>

        {showSearch ? (
          <form onSubmit={onSearchSubmit} className="hidden max-w-xl flex-1 md:flex" role="search">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search contests"
                placeholder="Search contests, hackathons, or topics"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="border-border bg-surface pl-9"
              />
            </div>
          </form>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="size-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 rounded-full p-0" aria-label="Account menu">
                <Avatar className="size-9 border border-border">
                  <AvatarImage src="" alt="User avatar" />
                  <AvatarFallback className="bg-surface text-sm text-foreground">CA</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-border bg-surface">
              <DropdownMenuLabel className="flex items-center gap-2">
                <UserCircle2 className="size-4 text-accent" />
                My Account
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile/me">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut}>Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
