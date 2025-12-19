import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data: functions, error } = await supabase
    .from("team_functions")
    .select("*")
    .order("label");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(functions);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Check if user is admin
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data: currentUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();

  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json(
      { error: "Apenas administradores podem criar funções" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { name, label, description, color } = body;

  if (!name || !label) {
    return NextResponse.json(
      { error: "Nome e rótulo são obrigatórios" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("team_functions")
    .insert({
      name: name.toLowerCase().replace(/\s+/g, "_"),
      label,
      description,
      color: color || "#062D49",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();

  // Check if user is admin
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data: currentUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();

  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json(
      { error: "Apenas administradores podem editar funções" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { id, name, label, description, color } = body;

  if (!id) {
    return NextResponse.json(
      { error: "ID é obrigatório" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("team_functions")
    .update({
      name: name?.toLowerCase().replace(/\s+/g, "_"),
      label,
      description,
      color,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  // Check if user is admin
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data: currentUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();

  if (!currentUser || currentUser.role !== "admin") {
    return NextResponse.json(
      { error: "Apenas administradores podem excluir funções" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "ID é obrigatório" },
      { status: 400 }
    );
  }

  // Check if function is in use
  const { data: usersWithFunction } = await supabase
    .from("users")
    .select("id")
    .eq("team_function_id", id)
    .limit(1);

  if (usersWithFunction && usersWithFunction.length > 0) {
    return NextResponse.json(
      { error: "Esta função está sendo usada por usuários. Remova os usuários primeiro." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("team_functions")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
