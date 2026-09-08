import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  detectLocaleFromHeaders,
  getLocaleFromValue,
  isLocale,
  localeCookieName,
  type Locale,
} from "@/i18n/config";

const PUBLIC_SEGMENTS = ["auth", "lottery"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and auth.getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Assets, API and internal paths are never locale-redirected.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.includes(".") ||
    pathname.startsWith("/api")
  ) {
    return supabaseResponse;
  }

  // Determine locale: cookie preference first, then Accept-Language.
  const cookieLocale = getLocaleFromValue(
    request.cookies.get(localeCookieName)?.value,
  );
  const headerLocale = detectLocaleFromHeaders(
    request.headers.get("accept-language"),
  );
  const detectedLocale: Locale =
    request.cookies.has(localeCookieName)
      ? cookieLocale
      : headerLocale;

  // Path segments after any leading slash.
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  // No locale prefix → normalize to /{locale}/...
  if (!first || !isLocale(first)) {
    const url = request.nextUrl.clone();
    const rest = pathname === "/" ? "" : pathname;
    url.pathname = `/${detectedLocale}${rest}`;
    const response = NextResponse.redirect(url);
    response.cookies.set(localeCookieName, detectedLocale, {
      path: "/",
      sameSite: "lax",
    });
    return response;
  }

  // Refresh the cookie to the explicit prefix when it differs.
  const pathLocale = first as Locale;
  if (request.cookies.get(localeCookieName)?.value !== pathLocale) {
    supabaseResponse.cookies.set(localeCookieName, pathLocale, {
      path: "/",
      sameSite: "lax",
    });
  }

  // Public routes: /{locale}, /{locale}/auth/*, /{locale}/lottery/*
  const rest = segments.slice(1);
  const isPublic =
    rest.length === 0 || PUBLIC_SEGMENTS.includes(rest[0]);

  // Server actions send a Next-Action header; let the action's own auth
  // checks and redirects handle them instead of bounce-redirecting the POST.
  const isServerAction = request.headers.has("next-action");

  if (!isPublic && !user && !isServerAction) {
    const url = request.nextUrl.clone();
    url.pathname = `/${pathLocale}/auth/login`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};