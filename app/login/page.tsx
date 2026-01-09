"use client";

import { useEffect, useState } from "react";

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <p>Lade Login...</p>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Login</h1>

      <form>
        <input placeholder="E-Mail" />
        <br />
        <input placeholder="Passwort" type="password" />
        <br />
        <button>Login</button>
      </form>
    </div>
  );
}
