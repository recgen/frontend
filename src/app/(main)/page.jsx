"use client";

import { useAuth } from "@/context/auth";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">
        Привет, {user.name}! 👋
      </h1>
      <p className="mt-2 text-muted-foreground">
        Добро пожаловать в приложение
      </p>
    </div>
  );
}
