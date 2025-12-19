export type UserRole = "admin" | "user";

export interface TeamFunction {
  id: string;
  name: string;
  label: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  username: string; // formato nome.sobrenome
  role: UserRole;
  team_function_id?: string;
  team_function?: TeamFunction;
  avatar_url?: string;
  push_subscription?: string;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  date: string; // formato YYYY-MM-DD
  user_id: string;
  created_by: string;
  created_at: string;
}

export interface ScheduleWithUser extends Schedule {
  user: User;
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  user: "Usuário",
};

// Helper to get function label from user
export function getTeamFunctionLabel(user: User): string {
  return user.team_function?.label || "Sem função";
}
