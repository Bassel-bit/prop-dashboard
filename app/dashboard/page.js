"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const base =
      process.env.NEXT_PUBLIC_API_URL?.startsWith("http")
        ? process.env.NEXT_PUBLIC_API_URL
        : "https://backend-lyart-pi.vercel.app";

    console.log("API BASE:", base);

    fetch(`${base}/accounts`)
      .then((res) => {
        if (!res.ok) throw new Error("API Fehler");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>Dashboard</h1>

      <button
        onClick={() => {
          document.cookie = "token=; path=/; max-age=0";
          window.location.href = "/login";
        }}
        style={{ padding: 10, marginBottom: 12 }}
      >
        Logout
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {!data && !error && <p>Lade Daten…</p>}

      {data && (
        <pre style={{ background: "#f5f5f5", padding: 12 }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
