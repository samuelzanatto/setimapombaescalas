import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { Navbar } from "@/components/navbar";
import { FunctionsTable } from "@/components/functions-table";

export default async function FunctionsPage() {
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

  // Get all functions
  const { data: functions } = await supabase
    .from("team_functions")
    .select("*")
    .order("label");

  return (
    <div className="min-h-screen bg-beje">
      <Header user={currentUser} />
      <main className="pt-20 pb-20 mx-auto">
        <FunctionsTable functions={functions || []} />
      </main>
      <Navbar isAdmin={true} />
    </div>
  );
}
