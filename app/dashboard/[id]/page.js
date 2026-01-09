"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AccountDetails({ params }) {
  const { id } = params;
  const [metrics, setMetrics] = useState(null);
  const [trades, setTrades] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`http://127.0.0.1:8000/accounts/${id}/metrics`).then(r => r.json()),
      fetch(`http://127.0.0.1:8000/accounts/${id}/trades`).then(r => r.json()),
    ])
      .then(([m, t]) => {
        setMetrics(m);
        setTrades(Array.isArray(t) ? t : []);
      })
      .catch(() => setError("Backend nicht erreichbar."));
  }, [id]);

  return (
    <main style={{ maxWidth: 1000, margin: "40px auto", fontFamily: "Arial" }}>
      <Link href="/dashboard">← zurück</Link>
      <h1 style={{ marginTop: 10 }}>Account: {id}</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {metrics && (
        <>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 16 }}>
            <Card title="Equity Now" value={metrics.equity_now} />
            <Card title="Total PnL" value={metrics.total_pnl} />
            <Card title="Target Equity" value={metrics.target_equity} />
            <Card title="Status" value={(metrics.status || "").toUpperCase()} />
          </section>

          <section style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 12, padding: 14 }}>
  <b>Regeln & Fortschritt (Demo)</b>

  <div style={{ marginTop: 10 }}>
    Profit Target: {Math.round((metrics.target_progress || 0) * 100)}%
    <div style={{ height: 10, background: "#eee", borderRadius: 999, marginTop: 6 }}>
      <div
        style={{
          height: 10,
          width: `${Math.max(0, Math.min(100, Math.round((metrics.target_progress || 0) * 100)))}%`,
          background: "#111",
          borderRadius: 999,
        }}
      />
    </div>
    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
      Target Equity: {metrics.target_equity} | Current Equity: {metrics.equity_now}
    </div>
  </div>

  <div style={{ marginTop: 14 }}>
    Max Loss Floor: {metrics.max_loss_floor}
    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
      Wenn Equity darunter fällt → FAIL
    </div>
  </div>

  <div style={{ marginTop: 14 }}>
    Trading Days: {metrics.days_traded} / {metrics.min_trading_days}
    <div style={{ height: 10, background: "#eee", borderRadius: 999, marginTop: 6 }}>
      <div
        style={{
          height: 10,
          width: `${Math.max(
            0,
            Math.min(100, Math.round((metrics.days_traded / metrics.min_trading_days) * 100))
          )}%`,
          background: "#111",
          borderRadius: 999,
        }}
      />
    </div>
  </div>
</section>

        </>
      )}

      <h2 style={{ marginTop: 24 }}>Trades</h2>
      <div style={{ overflowX: "auto", border: "1px solid #ddd", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left" style={{ padding: 10 }}>Close</th>
              <th align="left" style={{ padding: 10 }}>Symbol</th>
              <th align="left" style={{ padding: 10 }}>Side</th>
              <th align="right" style={{ padding: 10 }}>PnL</th>
              <th align="right" style={{ padding: 10 }}>Volume</th>
            </tr>
          </thead>
          <tbody>
            {trades.map(t => (
              <tr key={t.id} style={{ borderTop: "1px solid #eee" }}>
                <td style={{ padding: 10 }}>{t.close_time}</td>
                <td style={{ padding: 10 }}>{t.symbol}</td>
                <td style={{ padding: 10 }}>{t.side}</td>
                <td style={{ padding: 10 }} align="right">{t.pnl}</td>
                <td style={{ padding: 10 }} align="right">{t.volume}</td>
              </tr>
            ))}
            {trades.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: 12, opacity: 0.7 }}>
                  Keine Trades (Demo).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Card({ title, value }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: 18, fontWeight: 800 }}>{value ?? "-"}</div>
    </div>
  );
}
