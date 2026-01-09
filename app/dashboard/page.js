'use client';

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://backend-lyart-pi.vercel.app";

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
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (m) {
    const d = new Date(m[3], m[2] - 1, m[1]);
    return d.getTime();
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

function formatMoney(n, currency = "EUR") {
  try {
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(n || 0));
  } catch {
    return `${Number(n || 0).toFixed(0)} ${currency}`;
  }
}

function Badge({ status }) {
  const s = safeLower(status);
  const map = {
    active: ["Active", "bg-green-500/10 text-green-200 border-green-500/30", "bg-green-400"],
    paused: ["Paused", "bg-amber-500/10 text-amber-200 border-amber-500/30", "bg-amber-400"],
    inactive: ["Inactive", "bg-zinc-500/10 text-zinc-200 border-zinc-500/30", "bg-zinc-400"],
  };

  const [label, cls, dot] = map[s] || map.inactive;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${cls}`}>
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortMode, setSortMode] = useState("balance_desc");

  useEffect(() => {
    fetch(`${API_URL}/accounts`)
      .then((r) => r.json())
      .then((d) => setAccounts(Array.isArray(d) ? d : d.accounts || []));
  }, []);

  const data = useMemo(() => {
    return accounts.map((a) => ({
      id: a.id || a.account_id,
      name: a.name,
      balance: parseNumber(a.starting_balance),
      currency: a.currency,
      status: safeLower(a.status),
      date: a.start_date,
      ts: parseDateToTS(a.start_date),
    }));
  }, [accounts]);

  const filtered = useMemo(() => {
    let list = data;

    if (query) {
      list = list.filter(
        (a) =>
          safeLower(a.name).includes(query) ||
          safeLower(a.id).includes(query)
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }

    list = [...list].sort((a, b) => {
      if (sortMode === "balance_desc") return b.balance - a.balance;
      if (sortMode === "balance_asc") return a.balance - b.balance;
      if (sortMode === "date_desc") return b.ts - a.ts;
      if (sortMode === "date_asc") return a.ts - b.ts;
      return 0;
    });

    return list;
  }, [data, query, statusFilter, sortMode]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <h1 className="text-3xl font-extrabold mb-6">Swiss Prop Dashboard</h1>

      <input
        placeholder="Suche nach Name oder ID..."
        className="w-full p-3 rounded-xl bg-black/20 border border-white/10 mb-4"
        onChange={(e) => setQuery(e.target.value.toLowerCase())}
      />

      <div className="flex gap-2 mb-4">
        {["all", "active", "paused", "inactive"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl border ${
              statusFilter === s ? "bg-white/10" : "bg-white/5"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <select
        onChange={(e) => setSortMode(e.target.value)}
        className="p-3 rounded-xl bg-black/20 border border-white/10 mb-6"
      >
        <option value="balance_desc">Balance ↓</option>
        <option value="balance_asc">Balance ↑</option>
        <option value="date_desc">Start Date ↓</option>
        <option value="date_asc">Start Date ↑</option>
      </select>

      <table className="w-full border border-white/10 rounded-xl overflow-hidden">
        <thead className="bg-white/5">
          <tr>
            <th className="p-4">Name</th>
            <th className="p-4">ID</th>
            <th className="p-4">Balance</th>
            <th className="p-4">Currency</th>
            <th className="p-4">Status</th>
            <th className="p-4">Date</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((a) => (
            <tr key={a.id} className="border-t border-white/5">
              <td className="p-4 font-bold">{a.name}</td>
              <td className="p-4 text-sm">{a.id}</td>
              <td className="p-4 font-bold">{formatMoney(a.balance, a.currency)}</td>
              <td className="p-4">{a.currency}</td>
              <td className="p-4"><Badge status={a.status} /></td>
              <td className="p-4">{a.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
