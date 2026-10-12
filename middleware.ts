import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as any;
    const path = req.nextUrl.pathname;

    if (path.startsWith("/admin") && path !== "/admin/login" && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    if (
      !path.startsWith("/admin") &&
      token?.role !== "STUDENT" &&
      [
        "/dashboard",
        "/create-paper",
        "/create-notes",
        "/my-papers",
        "/quiz",
        "/leaderboard",
        "/lesson",
      ].some((p) => path.startsWith(p))
    ) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => true, // we do the redirect logic ourselves above
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/create-paper/:path*",
    "/create-notes/:path*",
    "/my-papers/:path*",
    "/quiz/:path*",
    "/leaderboard/:path*",
    "/lesson/:path*",
    "/admin/:path*",
  ],
};
