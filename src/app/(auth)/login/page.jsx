"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/auth";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.target);

    try {
      const user = await api.post("/auth/login", {
        email: formData.get("email"),
        password: formData.get("password"),
      });
      setUser(user);
      router.push("/");
    } catch (err) {
      if (err.status === 401 || err.status == 404) {
        setError("Не удалось войти, проверьте email и пароль");
      } else {
        setError(err.message || "Не удалось войти");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-none">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Вход в систему
          </CardTitle>
          <CardDescription>
            Введите свои данные для входа
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ivan@ivanov.ru"
                required
                pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Войти
            </Button>

            <p className="text-sm text-muted-foreground">
              Нет аккаунта?{" "}
              <Link
                href="/signup"
                className="text-foreground underline underline-offset-4 hover:text-primary"
              >
                Зарегистрироваться
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
