import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Navbar } from "@/components/navbar";
import { ScheduleCalendar } from "@/components/schedule-calendar";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  // Get current user profile
  const { data: currentUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!currentUser) {
    // Create user profile if doesn't exist
    const { data: newUser } = await supabase
      .from("users")
      .insert({
        id: authUser.id,
        email: authUser.email!,
        full_name: authUser.user_metadata?.full_name || authUser.email!.split("@")[0],
        username: authUser.email!.split("@")[0],
        role: "user",
        team_function: "camera",
      })
      .select()
      .single();

    if (!newUser) {
      redirect("/login");
    }
  }

  const user = currentUser || (await supabase
    .from("users")
    .select(`
      *,
      team_function:team_functions(*)
    `)
    .eq("id", authUser.id)
    .single()).data;

  if (!user) {
    redirect("/login");
  }

  // Get all users
  const { data: users } = await supabase
    .from("users")
    .select(`
      *,
      team_function:team_functions(*)
    `)
    .order("full_name");

  // Get all schedules with user info
  const { data: schedules } = await supabase
    .from("schedules")
    .select(`
      *,
      user:users!schedules_user_id_fkey(
        *,
        team_function:team_functions(*)
      )
    `)
    .order("date");

  const isAdmin = user.role === "admin";

  return (
    <div className="min-h-screen bg-beje">
      <Header user={user} />
      <main className="pt-28 pb-20 px-24 min-w-7xl mx-auto">
        <ScheduleCalendar
          schedules={schedules || []}
          users={users || []}
          currentUser={user}
          isAdmin={isAdmin}
        />
      </main>
      <Navbar isAdmin={isAdmin} />
    </div>
  );
}

