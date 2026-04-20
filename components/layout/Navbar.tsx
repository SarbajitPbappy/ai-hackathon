"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, Search, UserCircle2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
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
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

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
          {/* Show skeleton while auth state loads */}
          {user === undefined ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-surface" />
          ) : user ? (
            <>
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="size-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-full p-0" aria-label="Account menu">
                  <Avatar className="size-9 border border-border">
                    <AvatarImage src="" alt="User avatar" />
                    <AvatarFallback className="bg-surface text-sm text-foreground">
                      {user.email?.slice(0, 2).toUpperCase() ?? "CA"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border-border bg-surface">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <UserCircle2 className="size-4 text-accent" />
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/dashboard")}>Dashboard</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/profile/me")}>Profile</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onSignOut}>Sign Out</DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
