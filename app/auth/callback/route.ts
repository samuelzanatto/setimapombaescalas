import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to password setup page
      return NextResponse.redirect(new URL("/auth/set-password", request.url));
    }
  }

  // Return the user to an error page
  return NextResponse.redirect(new URL("/auth/error", request.url));
}
