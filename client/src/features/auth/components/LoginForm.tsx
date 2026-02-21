import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "../../../shared/components/ui/Button";
import { Input } from "../../../shared/components/ui/Input";
import type { LoginCredentials } from "../types/auth.types";

interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => void;
  isLoading: boolean;
}

export const LoginForm = ({ onSubmit, isLoading }: LoginFormProps) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      <Input
        label="Email"
        type="email"
        name="email"
        id="email"
        value={formData.email}
        onChange={e => setFormData({ ...formData, email: e.target.value })}
        required
        autoComplete="username"
        placeholder="tu@email.com"
      />

      <Input
        label="Contraseña"
        type="password"
        name="password"
        id="password"
        value={formData.password}
        onChange={e => setFormData({ ...formData, password: e.target.value })}
        required
        autoComplete="current-password"
        placeholder="••••••••"
      />

      <Button
        type="submit"
        loading={isLoading}
        className="bg-linear-to-r w-full from-purple-600 to-pink-600 font-bold text-white hover:from-purple-700 hover:to-pink-700 focus:ring-purple-500"
      >
        {isLoading ? "Ingresando..." : "Iniciar sesión"}
      </Button>
    </form>
  );
};
