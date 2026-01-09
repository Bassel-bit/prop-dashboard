"use client";

import { useEffect, useState } from "react";

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <p style={{ padding: 24 }}>Lade Login...</p>;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Minimal-Login: Passwort prüfen (wie früher)
    if (password !== "1234") {
      setError("Falsches Passwort");
      return;
    }

    // Cookie setzen (Middleware/Login-Check kann das nutzen)
    document.cookie = `token=ok; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 Tage

    // Redirect
    const next =
      new URLSearchParams(window.location.search).get("next") || "/dashboard";
    window.location.href = next;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="Passwort"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: 8, width: 260 }}
          />
        </div>

        <button type="submit" style={{ padding: 10 }}>
          Login
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: 12 }}>{error}</p>}
    </div>
  );
}
