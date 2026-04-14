"use client";
import { useEffect, useState } from "react";
import { listHistory, HistoryEntry } from "@/lib/api";
import HistoryTable from "@/components/HistoryTable";

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await listHistory();
      setEntries(res.history);
      setError("");
    } catch {
      setError("Failed to load history. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const stats = {
    total: entries.length,
    sent: entries.filter((e) => e.status === "Sent").length,
    replied: entries.filter((e) => e.status === "Replied").length,
    draft: entries.filter((e) => e.status === "Draft").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">History Log</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Track all your generated outreach messages and their status.
          </p>
        </div>
        <button onClick={refresh} className="btn-secondary text-sm py-2">
          Refresh
        </button>
      </div>

      {/* Stats */}
      {entries.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-[#1B3A6B]" },
            { label: "Draft", value: stats.draft, color: "text-gray-600" },
            { label: "Sent", value: stats.sent, color: "text-blue-600" },
            { label: "Replied", value: stats.replied, color: "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40 text-[#64748B] text-sm gap-2">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="#CBD5E1" strokeWidth="2"/>
            <path d="M8 2a6 6 0 016 6" stroke="#1B3A6B" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Loading history...
        </div>
      ) : (
        <HistoryTable entries={entries} onRefresh={refresh} />
      )}
    </div>
  );
}
