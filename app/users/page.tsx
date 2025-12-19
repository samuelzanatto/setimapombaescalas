import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Navbar } from "@/components/navbar";
import { UsersTable } from "@/components/users-table";

export default async function UsersPage() {
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

  if (!currentUser || currentUser.role !== "admin") {
    // Only admins can access this page
    redirect("/");
  }

  // Get all users
  const { data: users } = await supabase
    .from("users")
    .select(`
      *,
      team_function:team_functions(*)
    `)
    .order("full_name");

  return (
    <div className="min-h-screen bg-beje">
      <Header user={currentUser} />
      <main className="pt-20 pb-20 mx-auto">
        <UsersTable users={users || []} />
      </main>
      <Navbar isAdmin={true} />
    </div>
  );
}
