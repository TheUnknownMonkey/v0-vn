import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse, type NextRequest } from "next/server"

// Check if Supabase environment variables are available
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

export async function updateSession(request: NextRequest) {
  // If Supabase is not configured, just continue without auth
  if (!isSupabaseConfigured) {
    return NextResponse.next({
      request,
    })
  }

  // Skip middleware for static assets and API routes
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next()
  }

  console.log(`Middleware: Processing ${request.nextUrl.pathname}`)

  const res = NextResponse.next()

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req: request, res })

  // Check if this is an auth callback
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    console.log("Middleware: Auth callback detected, exchanging code for session")
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)
    // Redirect to dashboard after successful auth
    console.log("Middleware: Auth callback redirecting to /dashboard")
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log(`Middleware: Path=${request.nextUrl.pathname}, HasSession=${!!session}`)

  // Define route types
  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/auth/login") ||
    request.nextUrl.pathname.startsWith("/auth/sign-up") ||
    request.nextUrl.pathname === "/auth/callback"

  const isDashboardRoute = request.nextUrl.pathname.startsWith("/dashboard")
  const isRootRoute = request.nextUrl.pathname === "/"

  // Handle authenticated users on auth routes
  if (isAuthRoute && session) {
    console.log("Middleware: Authenticated user on auth route, redirecting to /dashboard")
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Handle unauthenticated users on protected routes
  if (!isAuthRoute && !session) {
    console.log("Middleware: Unauthenticated user on protected route, redirecting to /auth/login")
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // For all other cases, continue with the request
  return res
}
