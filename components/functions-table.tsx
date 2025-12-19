"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Plus } from "lucide-react";
import type { TeamFunction } from "@/lib/types";
import { useAlert } from "@/components/alert-provider";

interface FunctionsTableProps {
  functions: TeamFunction[];
}

export function FunctionsTable({ functions: initialFunctions }: FunctionsTableProps) {
  const [functions, setFunctions] = useState<TeamFunction[]>(initialFunctions);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFunction, setEditingFunction] = useState<TeamFunction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { confirm, notify } = useAlert();

  const [formData, setFormData] = useState({
    name: "",
    label: "",
    description: "",
    color: "#062D49",
  });

  const handleCreateFunction = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/functions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        notify.error(`Erro ao criar função: ${error.error}`);
        return;
      }

      const newFunction = await response.json();
      setFunctions([...functions, newFunction]);
      setIsCreateDialogOpen(false);
      resetForm();
      notify.success("Função criada com sucesso!");
    } catch (error) {
      console.error("Error creating function:", error);
      notify.error("Erro ao criar função");
    }

    setIsLoading(false);
  };

  const handleUpdateFunction = async () => {
    if (!editingFunction) return;
    setIsLoading(true);

    try {
      const response = await fetch("/api/functions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingFunction.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        notify.error(`Erro ao atualizar função: ${error.error}`);
        return;
      }

      const updatedFunction = await response.json();
      setFunctions(functions.map((f) => (f.id === updatedFunction.id ? updatedFunction : f)));
      setIsEditDialogOpen(false);
      setEditingFunction(null);
      resetForm();
      notify.success("Função atualizada com sucesso!");
    } catch (error) {
      console.error("Error updating function:", error);
      notify.error("Erro ao atualizar função");
    }

    setIsLoading(false);
  };

  const handleDeleteFunction = async (functionId: string) => {
    const confirmed = await confirm({
      title: "Excluir Função",
      description: "Tem certeza que deseja excluir esta função? Esta ação não pode ser desfeita.",
      type: "error",
      confirmText: "Excluir",
      cancelText: "Cancelar",
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/functions?id=${functionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        notify.error(`Erro ao excluir função: ${error.error}`);
        return;
      }

      setFunctions(functions.filter((f) => f.id !== functionId));
      notify.success("Função excluída com sucesso!");
    } catch (error) {
      console.error("Error deleting function:", error);
      notify.error("Erro ao excluir função");
    }
  };

  const openEditDialog = (func: TeamFunction) => {
    setEditingFunction(func);
    setFormData({
      name: func.name,
      label: func.label,
      description: func.description || "",
      color: func.color,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      label: "",
      description: "",
      color: "#062D49",
    });
  };

  return (
    <div className="px-6 md:px-24 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-navy">Gerenciar Funções</h2>
          <p className="text-gray-600 text-sm mt-1">{functions.length} função(ões) no sistema</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-navy hover:bg-navy/90 text-neve">
              <Plus className="h-4 w-4 mr-2" />
              Nova Função
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-neve">
            <DialogHeader>
              <DialogTitle className="text-navy">Criar Nova Função</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="label" className="text-navy font-semibold">Nome da Função</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ 
                      ...formData, 
                      label: e.target.value,
                      name: e.target.value.toLowerCase().replace(/\s+/g, "_")
                    })
                  }
                  placeholder="Ex: Operador de Câmera"
                  className="border-navy/20"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-navy font-semibold">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descrição da função..."
                  className="border-navy/20"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color" className="text-navy font-semibold">Cor</Label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    id="color"
                    value={formData.color}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-12 h-10 rounded border border-navy/20 cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    placeholder="#062D49"
                    className="border-navy/20 flex-1"
                  />
                </div>
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
                onClick={handleCreateFunction}
                disabled={isLoading || !formData.label}
                className="bg-navy hover:bg-navy/90 text-neve"
              >
                {isLoading ? "Criando..." : "Criar Função"}
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
              <TableHead className="text-neve font-bold w-12">Cor</TableHead>
              <TableHead className="text-neve font-bold">Nome</TableHead>
              <TableHead className="text-neve font-bold">Descrição</TableHead>
              <TableHead className="text-neve font-bold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {functions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                  Nenhuma função encontrada
                </TableCell>
              </TableRow>
            ) : (
              functions.map((func) => (
                <TableRow
                  key={func.id}
                  className="hover:bg-beje/30 transition-colors border-b border-beje/20"
                >
                  <TableCell className="py-4">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: func.color }}
                    />
                  </TableCell>
                  <TableCell className="font-medium text-navy">{func.label}</TableCell>
                  <TableCell className="text-gray-600">{func.description || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(func)}
                        className="text-navy hover:bg-navy/10"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFunction(func.id)}
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
            <DialogTitle className="text-navy">Editar Função</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_label" className="text-navy font-semibold">Nome da Função</Label>
              <Input
                id="edit_label"
                value={formData.label}
                onChange={(e) =>
                  setFormData({ 
                    ...formData, 
                    label: e.target.value,
                    name: e.target.value.toLowerCase().replace(/\s+/g, "_")
                  })
                }
                className="border-navy/20"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_description" className="text-navy font-semibold">Descrição</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="border-navy/20"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_color" className="text-navy font-semibold">Cor</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  id="edit_color"
                  value={formData.color}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-12 h-10 rounded border border-navy/20 cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="border-navy/20 flex-1"
                />
              </div>
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
              onClick={handleUpdateFunction}
              disabled={isLoading}
              className="bg-navy hover:bg-navy/90 text-neve"
            >
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
