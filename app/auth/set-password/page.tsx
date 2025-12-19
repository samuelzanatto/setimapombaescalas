"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
        return;
      }

      // Password set successfully, redirect to login
      router.push("/login?message=Senha definida com sucesso! Faça login.");
    } catch (err) {
      setError("Erro ao definir senha");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-beje to-beje/80 px-4">
      <div className="w-full max-w-md">
        <div className="bg-neve rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-navy mb-2">Definir Senha</h1>
          <p className="text-gray-600 mb-6">
            Você foi convidado para a plataforma. Defina sua senha para continuar.
          </p>

          <form onSubmit={handleSetPassword} className="space-y-4">
            <div>
              <Label htmlFor="password" className="text-navy">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Sua nova senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 border-navy/20"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-navy">
                Confirmar Senha
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 border-navy/20"
                disabled={isLoading}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-navy hover:bg-navy/90 text-neve"
            >
              {isLoading ? "Definindo..." : "Definir Senha e Entrar"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
