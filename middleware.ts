import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_ROUTES = ["/login", "/register"];
const DASHBOARD_PREFIXES = ["/dashboard"];
const ADMIN_PREFIX = "/admin";
const JUDGE_PREFIX = "/judge";

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isDashboardRoute = DASHBOARD_PREFIXES.some((route) => pathname.startsWith(route));
  const isAdminRoute = pathname.startsWith(ADMIN_PREFIX);
  const isJudgeRoute = pathname.startsWith(JUDGE_PREFIX);

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if ((isDashboardRoute || isAdminRoute || isJudgeRoute) && !user) {
    return redirectToLogin(request);
  }

  if (!user || (!isAdminRoute && !isJudgeRoute)) {
    return response;
  }

  // Use admin client (service role) to bypass RLS for role check.
  // The user is already authenticated via getUser() above.
  if (!supabaseServiceRoleKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is missing — cannot check user role");
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userRow, error: roleError } = await admin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (roleError) {
    console.error("Failed to fetch user role:", roleError.message);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const role = userRow?.role;
  if (isAdminRoute && role !== "organizer" && role !== "super_admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isJudgeRoute && role !== "judge") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

