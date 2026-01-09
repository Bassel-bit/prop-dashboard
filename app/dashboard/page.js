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
  const cfg =
    s === "active"
      ? { bg: "#E8F7EE", fg: "#146C2E", label: "Active" }
      : s === "inactive"
      ? { bg: "#FDECEC", fg: "#8A1C1C", label: "Inactive" }
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
        fontWeight: 600,
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
        background: "#fff",
        border: "1px solid #eee",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
        minHeight: 92,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ color: "#666", fontSize: 13, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>
        {value}
      </div>
      {sub ? (
        <div style={{ color: "#888", fontSize: 12, marginTop: 6 }}>{sub}</div>
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
    const active = accounts.filter((a) => String(a?.status).toLowerCase() === "active").length;

    // Summe Starting Balance (nur wenn Zahlen)
    const sum = accounts.reduce((acc, a) => {
      const v = Number(a?.starting_balance);
      return Number.isFinite(v) ? acc + v : acc;
    }, 0);

    // Häufigste Currency
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
        background:
          "radial-gradient(1200px 600px at 20% 0%, #F3F6FF 0%, #FAFAFA 55%, #FFFFFF 100%)",
        padding: 24,
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
            <h1 style={{ margin: 0, fontSize: 28, letterSpacing: -0.5 }}>
              Prop Firm Dashboard
            </h1>
            <div style={{ color: "#666", marginTop: 6, fontSize: 14 }}>
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
              border: "1px solid #eee",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Logout
          </button>
        </div>

        {/* Error / Loading */}
        {error && (
          <div
            style={{
              background: "#FDECEC",
              color: "#8A1C1C",
              border: "1px solid #F7C9C9",
              padding: 12,
              borderRadius: 14,
              marginBottom: 16,
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {!data && !error && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #eee",
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
              marginBottom: 16,
            }}
          >
            Lade Daten…
          </div>
        )}

        {/* Stat cards */}
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
            value={formatMoney(stats.sum, stats.topCurrency === "EUR" ? "EUR" : "EUR")}
            sub="Summe (Starting Balance)"
          />
          <StatCard title="Top Currency" value={stats.topCurrency} sub="Häufigste Währung" />
        </div>

        {/* Filters */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 16,
            padding: 14,
            boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
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
              fontWeight: 600,
            }}
          >
            <option value="all">Alle Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="paused">Paused</option>
          </select>

          <div style={{ color: "#666", fontSize: 13, fontWeight: 600 }}>
            {filtered.length} angezeigt
          </div>
        </div>

        {/* Table */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 6px 18px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FAFAFA" }}>
                  {["Name", "ID", "Starting Balance", "Currency", "Status", "Start Date"].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: "left",
                          padding: "12px 14px",
                          fontSize: 12,
                          color: "#666",
                          fontWeight: 800,
                          borderBottom: "1px solid #eee",
                          letterSpacing: 0.2,
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
                    <td style={{ padding: "12px 14px", fontWeight: 800 }}>
                      {a?.name || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#555", fontFamily: "monospace" }}>
                      {a?.id || "—"}
                    </td>
                    <td style={{ padding: "12px 14px", fontWeight: 700 }}>
                      {formatMoney(Number(a?.starting_balance || 0), a?.currency || "EUR")}
                    </td>
                    <td style={{ padding: "12px 14px", color: "#555", fontWeight: 700 }}>
                      {a?.currency || "—"}
                    </td>
                    <td style={{ padding: "12px 14px" }}>
                      <StatusPill status={a?.status} />
                    </td>
                    <td style={{ padding: "12px 14px", color: "#555", fontWeight: 700 }}>
                      {formatDate(a?.start_date)}
                    </td>
                  </tr>
                ))}

                {!error && data && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 16, color: "#666" }}>
                      Keine Accounts gefunden.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ color: "#999", fontSize: 12, marginTop: 12 }}>
          Tipp: Suche nach <span style={{ fontFamily: "monospace" }}>acc_</span> oder filtere
          Status.
        </div>
      </div>
    </div>
  );
}
