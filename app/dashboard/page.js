"use client";

import { useEffect, useMemo, useState } from "react";

function formatMoney(value, currency = "EUR") {
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(d);
}

function StatusPill({ status }) {
  const s = String(status || "").toLowerCase();

  // Wunsch: "active" schön rot
  const cfg =
    s === "active"
      ? { bg: "#FFE8EA", fg: "#C1121F", label: "Active" } // rot
      : s === "inactive"
      ? { bg: "#EEE", fg: "#333", label: "Inactive" }
      : s === "paused"
      ? { bg: "#FFF4E5", fg: "#7A4A00", label: "Paused" }
      : { bg: "#EEF2FF", fg: "#283593", label: status || "Unknown" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 999,
        background: cfg.bg,
        color: cfg.fg,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: cfg.fg,
          display: "inline-block",
        }}
      />
      {cfg.label}
    </span>
  );
}

function StatCard({ title, value, sub }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #eee",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
        minHeight: 96,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ color: "#444", fontSize: 13, fontWeight: 900 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.3 }}>
        {value}
      </div>
      {sub ? (
        <div style={{ color: "#666", fontSize: 12, marginTop: 6, fontWeight: 700 }}>
          {sub}
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const base =
      process.env.NEXT_PUBLIC_API_URL?.startsWith("http")
        ? process.env.NEXT_PUBLIC_API_URL
        : "https://backend-lyart-pi.vercel.app";

    fetch(`${base}/accounts`)
      .then((res) => {
        if (!res.ok) throw new Error("Backend nicht erreichbar");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  const accounts = Array.isArray(data) ? data : [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accounts.filter((a) => {
      const matchQ =
        !q ||
        String(a?.name || "").toLowerCase().includes(q) ||
        String(a?.id || "").toLowerCase().includes(q);

      const matchStatus =
        statusFilter === "all" ||
        String(a?.status || "").toLowerCase() === statusFilter;

      return matchQ && matchStatus;
    });
  }, [accounts, query, statusFilter]);

  const stats = useMemo(() => {
    const total = accounts.length;
    const active = accounts.filter(
      (a) => String(a?.status || "").toLowerCase() === "active"
    ).length;

    const sum = accounts.reduce((acc, a) => {
      const v = Number(a?.starting_balance);
      return Number.isFinite(v) ? acc + v : acc;
    }, 0);

    const counts = {};
    for (const a of accounts) {
      const c = a?.currency || "—";
      counts[c] = (counts[c] || 0) + 1;
    }
    const topCurrency =
      Object.entries(counts).sort((x, y) => y[1] - x[1])[0]?.[0] || "—";

    return { total, active, sum, topCurrency };
  }, [accounts]);

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        background:
          "radial-gradient(1200px 700px at 20% 0%, #2A2A2A 0%, #121212 55%, #0B0B0B 100%)",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Topbar */}
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 30, letterSpacing: -0.5, color: "#fff" }}>
              Prop Firm Dashboard
            </h1>
            <div style={{ color: "#BDBDBD", marginTop: 6, fontSize: 14 }}>
              Accounts aus deinem Backend
            </div>
          </div>

          <button
            onClick={() => {
              document.cookie = "token=; path=/; max-age=0";
              window.location.href = "/login";
            }}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 900,
            }}
          >
            Logout
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#2B0D10",
              color: "#FFB3B8",
              border: "1px solid #5A1A20",
              padding: 12,
              borderRadius: 14,
              marginBottom: 16,
              fontWeight: 800,
            }}
          >
            {error}
          </div>
        )}

        {!data && !error && (
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              color: "#fff",
              fontWeight: 800,
            }}
          >
            Lade Daten…
          </div>
        )}

        {/* Stat cards (weiß) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <StatCard title="Accounts" value={stats.total} sub="Gesamt im System" />
          <StatCard title="Active" value={stats.active} sub="Aktive Accounts" />
          <StatCard
            title="Starting Balance"
            value={formatMoney(stats.sum, "EUR")}
            sub="Summe (Starting Balance)"
          />
          <StatCard title="Top Currency" value={stats.topCurrency} sub="Häufigste Währung" />
        </div>

        {/* Filters (weiß) */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 16,
            padding: 14,
            boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suche nach Name oder ID…"
            style={{
              flex: "1 1 280px",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #eaeaea",
              outline: "none",
              fontSize: 14,
              fontWeight: 700,
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #eaeaea",
              background: "#fff",
              fontWeight: 900,
            }}
          >
            <option value="all">Alle Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="paused">Paused</option>
          </select>

          <div style={{ color: "#444", fontSize: 13, fontWeight: 900 }}>
            {filtered.length} angezeigt
          </div>
        </div>

        {/* Table (weiß) */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#F6F6F6" }}>
                  {["Name", "ID", "Starting Balance", "Currency", "Status", "Start Date"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "12px 14px",
                          fontSize: 12,
                          color: "#444",
                          fontWeight: 900,
                          borderBottom: "1px solid #eee",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a?.id} style={{ borderBottom: "1px solid #f1f1f1" }}>
                    <td style={{ padding: "12px 14px", fontWeight: 900 }}>
                      {a?.name || "—"}
                    </td>
                    <td
                      style={{
                        padding: "12px 14px",
                        color: "#555",
                        fontFamily: "monospace",
                        fontWeight: 800,
                      }}
                    >
                      {a?.id || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 900 }}>
                      {formatMoney(Number(a?.starting_balance || 0), a?.currency || "EUR")}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#555", fontWeight: 900 }}>
                      {a?.currency || "—"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <StatusPill status={a?.status} />
                    </td>
                    <td style={{ padding: "12px 14px", color: "#555", fontWeight: 900 }}>
                      {formatDate(a?.start_date)}
                    </td>
                  </tr>
                ))}

                {!error && data && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 16, color: "#666", fontWeight: 800 }}>
                      Keine Accounts gefunden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ color: "#AFAFAF", fontSize: 12, marginTop: 12, fontWeight: 700 }}>
          Tipp: Suche nach <span style={{ fontFamily: "monospace" }}>acc_</span> oder filtere
          Status.
        </div>
      </div>
    </div>
  );
}
