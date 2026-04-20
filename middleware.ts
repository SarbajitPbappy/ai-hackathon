import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_ROUTES = ["/login", "/register"];
const DASHBOARD_PREFIXES = ["/dashboard", "/profile"];
const ADMIN_PREFIX = "/admin";
const JUDGE_PREFIX = "/judge";

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res: response });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  const isDashboardRoute = DASHBOARD_PREFIXES.some((route) =>
    pathname.startsWith(route),
  );
  const isAdminRoute = pathname.startsWith(ADMIN_PREFIX);
  const isJudgeRoute = pathname.startsWith(JUDGE_PREFIX);

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if ((isDashboardRoute || isAdminRoute || isJudgeRoute) && !session) {
    return redirectToLogin(request);
  }

  if (!session || (!isAdminRoute && !isJudgeRoute)) {
    return response;
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single();

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
