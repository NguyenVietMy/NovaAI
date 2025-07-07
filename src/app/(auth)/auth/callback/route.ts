import { createClient } from "../../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  console.log("CALLBACK URL:", requestUrl.toString());
  const code = requestUrl.searchParams.get("code");
  const redirect_to = requestUrl.searchParams.get("redirect_to");
  const type = requestUrl.searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    // If this is a password reset (no type param, but code is present), redirect to reset-password
    if (!type) {
      return NextResponse.redirect(
        new URL("/dashboard/reset-password", requestUrl.origin)
      );
    }
  }

  // If this is a password recovery, redirect to the reset-password page
  if (type === "recovery") {
    return NextResponse.redirect(
      new URL("/dashboard/reset-password", requestUrl.origin)
    );
  }

  // Otherwise, redirect to dashboard or provided redirect_to
  const redirectTo = redirect_to || "/dashboard";
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
}
