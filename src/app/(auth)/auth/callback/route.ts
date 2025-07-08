import { createClient } from "../../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const flow = url.searchParams.get("flow"); // 👈 comes from redirectTo
  const next = url.searchParams.get("redirect_to") || "/dashboard";

  /* ── Exchange PKCE code for a session ─────────────────────── */
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  /* ── Route by flow tag ─────────────────────────────────────── */
  switch (flow) {
    case "recovery":
      return NextResponse.redirect(
        new URL("/dashboard/reset-password", url.origin)
      );

    case "signup":
      // Send newly-confirmed users wherever you like (dashboard, onboarding, etc.)
      return NextResponse.redirect(new URL("/", url.origin));

    // add more cases (e.g. "magic") if you tag other flows
    default:
      return NextResponse.redirect(new URL(next, url.origin));
  }
}
