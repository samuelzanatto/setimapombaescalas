import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check if user is admin
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: currentUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", authUser.id)
      .single();

    if (currentUser?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can create users" },
        { status: 403 }
      );
    }

    const { email, full_name, role, team_function_id } = await request.json();

    // Create admin client with service role key
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Invite user (sends email)
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
      data: {
        full_name,
      },
    });

    if (error) {
      console.error("Auth invitation error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // The user profile will be created automatically by the trigger
    // But let's verify it was created
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError || !userProfile) {
      // If trigger didn't create it, create manually
      const username = email.split("@")[0];
      await supabase.from("users").insert({
        id: data.user.id,
        email,
        full_name,
        username,
        role,
        team_function_id,
      });
    } else if (role !== "user" || team_function_id) {
      // Update role and team_function_id if needed
      await supabase
        .from("users")
        .update({ role, team_function_id })
        .eq("id", data.user.id);
    }

    const { data: finalUser } = await supabase
      .from("users")
      .select(`
        *,
        team_function:team_functions(*)
      `)
      .eq("id", data.user.id)
      .single();

    return NextResponse.json(finalUser);
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
