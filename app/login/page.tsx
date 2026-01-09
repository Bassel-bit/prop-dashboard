"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    // Dummy-Login: Cookie setzen
    document.cookie = "token=1; path=/; max-age=86400";

    // Weiterleitung
    router.push(next);
  }

  return (
    <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
      <form onSubmit={handleLogin} style={{ display: "grid", gap: 12, width: 320 }}>
        <h2 style={{ textAlign: "center" }}>Login</h2>

        <input
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10 }}
        />

        <input
          placeholder="Passwort"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10 }}
        />

        <button type="submit" style={{ padding: 10 }}>
          Einloggen
        </button>
      </form>
    </div>
  );
}
