"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://backend-lyart-pi.vercel.app";

// Helpers
function safeLower(v) {
  return String(v || "").toLowerCase();
}

function parseNumber(v) {
  if (typeof v === "number") return v;
  const s = String(v ?? "").replace(/[^\d.-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function parseDateToTS(v) {
  const s = String(v || "").trim();
  if (!s) return 0;

  // DD.MM.YYYY
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])).getTime();

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function formatMoney(n, currency = "EUR") {
  const value = Number(n || 0);
  try {
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toFixed(0)} ${currency}`;
  }
}

// UI Components
function Badge({ status }) {
  const s = safeLower(status);

  const styles =
    s === "active"
      ? "bg-green-500/10 text-green-200 border-green-500/30"
      : s === "paused"
      ? "bg-amber-500/10 text-amber-200 border-amber-500/30"
      : "bg-zinc-500/10 text-zinc-200 border-zinc-500/30";

  const dot =
    s === "active" ? "bg-green-400" : s === "paused" ? "bg-amber-400" : "bg-zinc-400";

  const label =
    s === "active" ? "Active" : s === "paused" ? "Paused" : "Inactive";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${styles}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function KpiCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
      <div className="text-sm text-zinc-400">{title}</div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight">{value}</div>
      {subtitle ? <div className="mt-2 text-sm text-zinc-400">{subtitle}</div> : null}
    </div>
  );
}

function Chip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-xl px-4 py-2 text-sm font-semibold border transition",
        active
          ? "bg-white/10 border-white/20"
          : "bg-white/5 border-white/10 hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

// Main Page
export default function DashboardPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | paused | inactive
  const [sortMode, setSortMode] = useState("date_asc"); // date_asc|date_desc|balance_asc|balance_desc

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_URL}/accounts`, { cache: "no-store" });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.accounts ?? [];
        setAccounts(list);
      } catch (e) {
        setErr(e?.message || "Unbekannter Fehler");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const normalized = useMemo(() => {
    return accounts.map((a) => {
      const id = a.id ?? a.account_id ?? a.accountId ?? "";
      const name = a.name ?? a.account_name ?? a.accountName ?? "Account";
      const status = safeLower(a.status ?? a.state ?? "inactive");
      const currency = String(a.currency ?? "EUR").toUpperCase();
      const balance = parseNumber(a.starting_balance ?? a.startingBalance ?? a.balance ?? 0);
      const date = a.start_date ?? a.startDate ?? a.created_at ?? a.createdAt ?? "";
      const ts = parseDateToTS(date);

      return { id, name, status, currency, balance, date, ts };
    });
  }, [accounts]);

  const filtered = useMemo(() => {
    let list = normalized;

    const q = safeLower(query).trim();
    if (q) {
      list = list.filter((a) => safeLower(a.name).includes(q) || safeLower(a.id).includes(q));
    }

    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }

    list = [...list].sort((a, b) => {
      if (sortMode === "date_asc") return a.ts - b.ts;
      if (sortMode === "date_desc") return b.ts - a.ts;
      if (sortMode === "balance_asc") return a.balance - b.balance;
      if (sortMode === "balance_desc") return b.balance - a.balance;
      return 0;
    });

    return list;
  }, [normalized, query, statusFilter, sortMode]);

  const kpis = useMemo(() => {
    const total = normalized.length;
    const active = normalized.filter((a) => a.status === "active").length;
    const paused = normalized.filter((a) => a.status === "paused").length;
    const inactive = normalized.filter((a) => a.status === "inactive").length;
    const sum = normalized.reduce((s, a) => s + (a.balance || 0), 0);

    const freq = {};
    normalized.forEach((a) => (freq[a.currency] = (freq[a.currency] || 0) + 1));
    const topCurrency = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || "EUR";

    return { total, active, paused, inactive, sum, topCurrency };
  }, [normalized]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Topbar */}
      <div className="border-b border-white/10 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Swiss Prop Dashboard</h1>
            <p className="text-sm text-zinc-400">Swiss Prop – Client Accounts</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard title="Accounts" value={kpis.total} subtitle="Gesamt im System" />
          <KpiCard title="Active" value={kpis.active} subtitle="Aktive Accounts" />
          <KpiCard title="Paused" value={kpis.paused} subtitle="Pausierte Accounts" />
          <KpiCard
            title="Total Balance"
            value={formatMoney(kpis.sum, kpis.topCurrency)}
            subtitle={`Top Currency: ${kpis.topCurrency}`}
          />
        </div>

        {/* Controls */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suche nach Name oder ID…"
              className="w-full rounded-xl bg-black/20 border border-white/10 px-4 py-3 outline-none focus:border-white/20"
            />

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="flex gap-2 flex-wrap">
                <Chip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>all</Chip>
                <Chip active={statusFilter === "active"} onClick={() => setStatusFilter("active")}>active</Chip>
                <Chip active={statusFilter === "paused"} onClick={() => setStatusFilter("paused")}>paused</Chip>
                <Chip active={statusFilter === "inactive"} onClick={() => setStatusFilter("inactive")}>inactive</Chip>
              </div>

              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                className="rounded-xl bg-black/20 border border-white/10 px-4 py-3 text-sm outline-none"
              >
                <option value="date_asc">Start Date ↑</option>
                <option value="date_desc">Start Date ↓</option>
                <option value="balance_desc">Balance ↓</option>
                <option value="balance_asc">Balance ↑</option>
              </select>

              <div className="text-sm text-zinc-400 whitespace-nowrap">
                {filtered.length} angezeigt
              </div>
            </div>
          </div>

          {err ? (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
              Fehler: {err}
            </div>
          ) : null}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          {loading ? (
            <div className="p-6 text-zinc-300">Lade Accounts…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <colgroup>
                  <col className="w-[25%]" />
                  <col className="w-[15%]" />
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                </colgroup>

                <thead className="bg-white/5 border-b border-white/10">
                  <tr className="text-left text-sm font-semibold text-zinc-300">
                    <th className="px-5 py-4">Name</th>
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">Balance</th>
                    <th className="px-5 py-4">Currency</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {filtered.map((a) => (
                    <tr key={a.id || a.name} className="hover:bg-white/5 transition">
                      <td className="px-5 py-4 font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                        {a.name}
                      </td>
                      <td className="px-5 py-4 text-sm text-zinc-300 whitespace-nowrap overflow-hidden text-ellipsis">
                        {a.id || "—"}
                      </td>
                      <td className="px-5 py-4 font-semibold whitespace-nowrap">
                        {formatMoney(a.balance, a.currency)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-zinc-300 whitespace-nowrap">
                        {a.currency}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge status={a.status} />
                      </td>
                      <td className="px-5 py-4 font-semibold text-zinc-300 whitespace-nowrap">
                        {a.date || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="text-xs text-zinc-500">
          © Swiss Prop 2026 — Professional Trading Solutions
        </div>
      </div>
    </div>
  );
}
