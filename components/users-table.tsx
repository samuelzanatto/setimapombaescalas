"use client";

import { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Pencil, Trash2, UserPlus, Camera, X } from "lucide-react";
import type { User, UserRole, TeamFunction } from "@/lib/types";
import { USER_ROLE_LABELS, getTeamFunctionLabel } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useAlert } from "@/components/alert-provider";
import { UserAvatar } from "@/components/user-avatar";

interface UsersTableProps {
  users: User[];
}

export function UsersTable({ users: initialUsers }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [teamFunctions, setTeamFunctions] = useState<TeamFunction[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const { confirm, notify } = useAlert();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    role: "user" as UserRole,
    team_function_id: "",
  });

  // Load team functions on mount
  useEffect(() => {
    async function loadFunctions() {
      const response = await fetch("/api/functions");
      if (response.ok) {
        const data = await response.json();
        setTeamFunctions(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, team_function_id: prev.team_function_id || data[0].id }));
        }
      }
    }
    loadFunctions();
  }, []);

  const generateUsername = (fullName: string) => {
    const parts = fullName.toLowerCase().trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0]}.${parts[parts.length - 1]}`;
    }
    return parts[0] || "";
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notify.error("A imagem deve ter no máximo 5MB");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;
    
    setIsUploadingAvatar(true);
    
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;
    
    // Delete existing avatar if exists
    await supabase.storage.from('avatars').remove([`${userId}/avatar.jpg`, `${userId}/avatar.png`, `${userId}/avatar.webp`, `${userId}/avatar.gif`]);
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile, { upsert: true });
    
    if (uploadError) {
      console.error("Error uploading avatar:", uploadError);
      notify.error("Erro ao fazer upload da foto");
      setIsUploadingAvatar(false);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);
    
    setIsUploadingAvatar(false);
    return publicUrl;
  };

  const clearAvatarSelection = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateUser = async () => {
    setIsLoading(true);

    try {
      // Call server API to create user
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          team_function_id: formData.team_function_id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Error creating user:", error);
        notify.error(`Erro ao criar usuário: ${error.error}`);
        return;
      }

      const newUser = await response.json();
      // Add the team_function object to the new user
      const funcObj = teamFunctions.find(f => f.id === formData.team_function_id);
      if (funcObj) {
        newUser.team_function = funcObj;
      }
      setUsers([...users, newUser]);
      setIsCreateDialogOpen(false);
      resetForm();
      notify.success("Usuário criado com sucesso!");
    } catch (error) {
      console.error("Error creating user:", error);
      notify.error("Erro ao criar usuário");
    }

    setIsLoading(false);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setIsLoading(true);

    const username = generateUsername(formData.full_name);
    
    // Upload avatar if selected
    let avatarUrl = editingUser.avatar_url;
    if (avatarFile) {
      const uploadedUrl = await uploadAvatar(editingUser.id);
      if (uploadedUrl) {
        avatarUrl = uploadedUrl;
      }
    }

    const { data, error } = await supabase
      .from("users")
      .update({
        full_name: formData.full_name,
        email: formData.email,
        username,
        role: formData.role,
        team_function_id: formData.team_function_id,
        avatar_url: avatarUrl,
      })
      .eq("id", editingUser.id)
      .select(`
        *,
        team_function:team_functions(*)
      `)
      .single();

    if (!error && data) {
      setUsers(users.map((u) => (u.id === data.id ? data : u)));
      setIsEditDialogOpen(false);
      setEditingUser(null);
      resetForm();
      notify.success("Usuário atualizado com sucesso!");
    } else {
      notify.error("Erro ao atualizar usuário");
    }

    setIsLoading(false);
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = await confirm({
      title: "Excluir Usuário",
      description: "Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.",
      type: "error",
      confirmText: "Excluir",
      cancelText: "Cancelar",
    });

    if (!confirmed) return;

    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (!error) {
      setUsers(users.filter((u) => u.id !== userId));
      notify.success("Usuário excluído com sucesso!");
    } else {
      notify.error("Erro ao excluir usuário");
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      team_function_id: user.team_function_id || "",
    });
    setAvatarPreview(user.avatar_url || null);
    setAvatarFile(null);
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      role: "user",
      team_function_id: teamFunctions[0]?.id || "",
    });
    clearAvatarSelection();
  };

  return (
    <div className="px-6 md:px-24 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-navy">Gerenciar Usuários</h2>
          <p className="text-gray-600 text-sm mt-1">{users.length} usuário(s) no sistema</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-navy hover:bg-navy/90 text-neve">
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-neve">
            <DialogHeader>
              <DialogTitle className="text-navy">Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="full_name" className="text-navy font-semibold">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="João da Silva"
                  className="border-navy/20"
                />
                <p className="text-xs text-gray-600">
                  Usuário: {generateUsername(formData.full_name) || "nome.sobrenome"}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-navy font-semibold">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="joao@email.com"
                  className="border-navy/20"
                />
                <p className="text-xs text-gray-600">
                  Um e-mail será enviado para definição da senha.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role" className="text-navy font-semibold">Cargo</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as UserRole })
                  }
                  className="flex h-10 w-full rounded-md border border-navy/20 bg-neve px-3 py-2 text-sm text-navy"
                >
                  {Object.entries(USER_ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="team_function" className="text-navy font-semibold">Função na Equipe</Label>
                <select
                  id="team_function"
                  value={formData.team_function_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      team_function_id: e.target.value,
                    })
                  }
                  className="flex h-10 w-full rounded-md border border-navy/20 bg-neve px-3 py-2 text-sm text-navy"
                >
                  {teamFunctions.map((func) => (
                    <option key={func.id} value={func.id}>
                      {func.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                className="text-navy border-navy/20"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateUser}
                disabled={isLoading || !formData.full_name || !formData.email}
                className="bg-navy hover:bg-navy/90 text-neve"
              >
                {isLoading ? "Criando..." : "Criar Usuário"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table Container */}
      <div className="bg-neve rounded-lg overflow-hidden border border-beje">
        <Table>
          <TableHeader className="bg-navy text-neve">
            <TableRow className="hover:bg-navy">
              <TableHead className="text-neve font-bold w-12"></TableHead>
              <TableHead className="text-neve font-bold">Nome</TableHead>
              <TableHead className="text-neve font-bold">Usuário</TableHead>
              <TableHead className="text-neve font-bold">E-mail</TableHead>
              <TableHead className="text-neve font-bold">Cargo</TableHead>
              <TableHead className="text-neve font-bold">Função</TableHead>
              <TableHead className="text-neve font-bold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  className="hover:bg-beje/30 transition-colors border-b border-beje/20"
                >
                  <TableCell className="py-4">
                    <UserAvatar user={user} size="md" />
                  </TableCell>
                  <TableCell className="font-medium py-4 text-navy">{user.full_name}</TableCell>
                  <TableCell className="text-gray-600">{user.username}</TableCell>
                  <TableCell className="text-gray-600">{user.email}</TableCell>
                  <TableCell>
                    <span className="inline-block bg-navy/10 text-navy px-3 py-1 rounded-full text-sm font-medium">
                      {USER_ROLE_LABELS[user.role]}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-700">{getTeamFunctionLabel(user)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                        className="text-navy hover:bg-navy/10"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-neve">
          <DialogHeader>
            <DialogTitle className="text-navy">Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {avatarPreview ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <UserAvatar user={{ full_name: formData.full_name || "U" }} size="xl" />
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-navy rounded-full flex items-center justify-center text-neve hover:bg-navy/80 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
                {avatarPreview && avatarFile && (
                  <button
                    type="button"
                    onClick={clearAvatarSelection}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <p className="text-xs text-gray-500">Clique no ícone para alterar a foto</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit_full_name" className="text-navy font-semibold">Nome Completo</Label>
              <Input
                id="edit_full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="border-navy/20"
              />
              <p className="text-xs text-gray-600">
                Usuário: {generateUsername(formData.full_name)}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_email" className="text-navy font-semibold">E-mail</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="border-navy/20"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_role" className="text-navy font-semibold">Cargo</Label>
              <select
                id="edit_role"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as UserRole })
                }
                className="flex h-10 w-full rounded-md border border-navy/20 bg-neve px-3 py-2 text-sm text-navy"
              >
                {Object.entries(USER_ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_team_function" className="text-navy font-semibold">Função na Equipe</Label>
              <select
                id="edit_team_function"
                value={formData.team_function_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    team_function_id: e.target.value,
                  })
                }
                className="flex h-10 w-full rounded-md border border-navy/20 bg-neve px-3 py-2 text-sm text-navy"
              >
                {teamFunctions.map((func) => (
                  <option key={func.id} value={func.id}>
                    {func.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="text-navy border-navy/20"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={isLoading || isUploadingAvatar}
              className="bg-navy hover:bg-navy/90 text-neve"
            >
              {isLoading || isUploadingAvatar ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
