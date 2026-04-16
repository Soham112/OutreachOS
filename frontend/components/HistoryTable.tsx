"use client";
import { useState } from "react";
import { HistoryEntry, updateStatus, deleteEntry } from "@/lib/api";
import CopyButton from "./CopyButton";

const STATUS_OPTIONS = ["Draft", "Sent", "Replied", "No Response"] as const;

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Sent: "bg-blue-100 text-blue-700",
  Replied: "bg-green-100 text-green-700",
  "No Response": "bg-amber-100 text-amber-700",
};

const MESSAGE_TYPE_LABELS: Record<string, string> = {
  connection_request: "Connection",
  followup: "Follow-up",
  inmail: "InMail",
  cold_email_short: "Cold Email (Short)",
  cold_email_detailed: "Cold Email (Detailed)",
  cold_email_followup: "Cold Email (Follow-up)",
  cover_letter: "Cover Letter",
  actively_hiring_sequence: "Actively Hiring (2-Step)",
  post_application_dm: "Post-Application DM",
};

interface HistoryTableProps {
  entries: HistoryEntry[];
  onRefresh: () => void;
}

export default function HistoryTable({ entries, onRefresh }: HistoryTableProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const handleStatusChange = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await updateStatus(id, status);
      onRefresh();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await deleteEntry(id);
      if (expanded === id) setExpanded(null);
      onRefresh();
    } catch {
      alert("Delete failed");
    }
  };

  if (entries.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-[#f0f4fb] flex items-center justify-center mx-auto mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-sm text-[#64748B]">No messages saved yet. Generate and save messages to see them here.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Date</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Recipient</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hidden sm:table-cell">Company</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider hidden md:table-cell">Type</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F1F5F9]">
          {entries.map((entry) => (
            <>
              <tr
                key={entry.id}
                className="hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
              >
                <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 font-medium text-[#0F172A]">{entry.recipient_name}</td>
                <td className="px-4 py-3 text-[#64748B] hidden sm:table-cell">{entry.company || "—"}</td>
                <td className="px-4 py-3 text-[#64748B] hidden md:table-cell">
                  {MESSAGE_TYPE_LABELS[entry.message_type] || entry.message_type}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={entry.status}
                    onChange={(e) => handleStatusChange(entry.id, e.target.value)}
                    disabled={updatingId === entry.id}
                    className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 cursor-pointer outline-none ${STATUS_STYLES[entry.status] || "bg-gray-100 text-gray-700"}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-[#CBD5E1] hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M2 3.5h10M5.5 3.5V2.5h3V3.5M5 5.5l.5 5M9 5.5l-.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    </svg>
                  </button>
                </td>
              </tr>

              {/* Expanded row */}
              {expanded === entry.id && (
                <tr key={`exp-${entry.id}`} className="bg-[#F8FAFC]">
                  <td colSpan={6} className="px-4 py-4">
                    {entry.message_type === "actively_hiring_sequence" ? (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-[#1B3A6B] text-white text-xs font-bold flex items-center justify-center">1</span>
                            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Connection Request</span>
                          </div>
                          <p className="text-sm text-[#334155] whitespace-pre-wrap leading-relaxed pl-6">{entry.subject}</p>
                          <div className="pl-6"><CopyButton text={entry.subject} small label="Copy" /></div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-[#1B3A6B] text-white text-xs font-bold flex items-center justify-center">2</span>
                            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Follow-up DM</span>
                          </div>
                          <p className="text-sm text-[#334155] whitespace-pre-wrap leading-relaxed pl-6">{entry.message_body}</p>
                          <div className="pl-6"><CopyButton text={entry.message_body} small label="Copy" /></div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {entry.subject && (
                          <div>
                            <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Subject</span>
                            <p className="text-sm font-medium text-[#0F172A] mt-0.5">{entry.subject}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Message</span>
                          <p className="text-sm text-[#334155] mt-0.5 whitespace-pre-wrap leading-relaxed">{entry.message_body}</p>
                        </div>
                        <CopyButton
                          text={entry.subject ? `Subject: ${entry.subject}\n\n${entry.message_body}` : entry.message_body}
                          label="Copy Message"
                        />
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
