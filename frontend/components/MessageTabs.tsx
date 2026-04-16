"use client";
import { useState } from "react";
import { generateMessage, saveHistory, GenerateResult, ProfileData } from "@/lib/api";
import CopyButton from "./CopyButton";

interface MessageTabsProps {
  profile: ProfileData;
}

const TABS = [
  { id: "connection_request", label: "Connection Request", emoji: "🤝" },
  { id: "followup", label: "Follow-up", emoji: "💬" },
  { id: "inmail", label: "InMail", emoji: "📨" },
  { id: "cold_email", label: "Cold Email", emoji: "📧" },
  { id: "cover_letter", label: "Cover Letter", emoji: "📄" },
  { id: "applied_outreach", label: "Applied Outreach", emoji: "🎯" },
] as const;

const COLD_SUBTYPES = [
  { id: "cold_email_short", label: "Short", desc: "Under 100 words · Busy hiring managers" },
  { id: "cold_email_detailed", label: "Detailed", desc: "Under 200 words · Warmer leads" },
  { id: "cold_email_followup", label: "Follow-up", desc: "Under 50 words · After no reply" },
] as const;

const APPLIED_SUBTYPES = [
  {
    id: "actively_hiring_dm",
    label: "They're Actively Hiring",
    desc: "Found via LinkedIn search · Haven't applied yet",
  },
  {
    id: "post_application_dm",
    label: "Already Applied",
    desc: "Just submitted · Short nudge to get noticed",
  },
] as const;

type TabId = typeof TABS[number]["id"];
type ColdSubtype = typeof COLD_SUBTYPES[number]["id"];
type AppliedSubtype = typeof APPLIED_SUBTYPES[number]["id"];

function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2 text-sm text-[#64748B]">
      <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="#CBD5E1" strokeWidth="2"/>
        <path d="M8 2a6 6 0 016 6" stroke="#1B3A6B" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      Generating with Claude...
    </div>
  );
}

function CharCounter({ text, limit }: { text: string; limit: number }) {
  const count = text.length;
  const over = count > limit;
  return (
    <span className={`text-xs font-mono ${over ? "text-red-500" : "text-[#94A3B8]"}`}>
      {count}/{limit}
    </span>
  );
}

function WordCounter({ text }: { text: string }) {
  const count = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <span className="text-xs font-mono text-[#94A3B8]">{count} words</span>
  );
}

function JdWarning() {
  return (
    <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 shrink-0">
        <path d="M7 2L12.5 11.5H1.5L7 2Z" stroke="#b45309" strokeWidth="1.3" strokeLinejoin="round"/>
        <path d="M7 6v2.5" stroke="#b45309" strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="7" cy="10" r="0.5" fill="#b45309"/>
      </svg>
      <span>No job description provided. Cover letter will be general. Go back and attach a JD for a role-specific letter.</span>
    </div>
  );
}

function MessageBox({
  result,
  messageType,
  profile,
  onSave,
}: {
  result: GenerateResult;
  messageType: string;
  profile: ProfileData;
  onSave: () => void;
}) {
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      await saveHistory({
        recipient_name: profile.name,
        company: profile.company,
        recipient_type: profile.recipient_type,
        message_type: messageType,
        subject: result.subject || "",
        message_body: result.body || result.message || "",
      });
      setSaved(true);
      onSave();
    } catch {
      alert("Failed to save to history");
    }
  };

  if (result.subject !== undefined) {
    return (
      <div className="space-y-3">
        {result.subject && (
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Subject</span>
              <CopyButton text={result.subject} small />
            </div>
            <p className="text-sm font-medium text-[#0F172A]">{result.subject}</p>
          </div>
        )}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                {messageType === "cover_letter" ? "Cover Letter" : "Body"}
              </span>
              {messageType === "cover_letter" && <WordCounter text={result.body || ""} />}
            </div>
            <CopyButton text={result.body || ""} small />
          </div>
          <p className="text-sm text-[#334155] whitespace-pre-wrap leading-relaxed">{result.body}</p>
        </div>
        <div className="flex items-center gap-2">
          <CopyButton
            text={messageType === "cover_letter" ? (result.body || "") : `Subject: ${result.subject}\n\n${result.body}`}
            label="Copy All"
          />
          <button
            onClick={handleSave}
            disabled={saved}
            className="btn-secondary text-sm py-1.5"
          >
            {saved ? "Saved!" : "Save to History"}
          </button>
        </div>
      </div>
    );
  }

  const msg = result.message || "";
  const isConnectionReq = messageType === "connection_request";

  return (
    <div className="space-y-3">
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
        <div className="flex items-start justify-between mb-2 gap-2">
          {isConnectionReq && <CharCounter text={msg} limit={300} />}
          <CopyButton text={msg} small />
        </div>
        <p className="text-sm text-[#334155] whitespace-pre-wrap leading-relaxed">{msg}</p>
      </div>
      <div className="flex items-center gap-2">
        <CopyButton text={msg} />
        <button
          onClick={handleSave}
          disabled={saved}
          className="btn-secondary text-sm py-1.5"
        >
          {saved ? "Saved!" : "Save to History"}
        </button>
      </div>
    </div>
  );
}

export default function MessageTabs({ profile }: MessageTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("connection_request");
  const [coldSubtype, setColdSubtype] = useState<ColdSubtype>("cold_email_short");
  const [appliedSubtype, setAppliedSubtype] = useState<AppliedSubtype>("actively_hiring_dm");
  const [roleName, setRoleName] = useState("");
  const [results, setResults] = useState<Record<string, GenerateResult>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [, setSavedCount] = useState(0);

  const currentKey =
    activeTab === "cold_email"
      ? coldSubtype
      : activeTab === "applied_outreach"
      ? appliedSubtype
      : activeTab;

  const generate = async (key: string) => {
    if (loading[key]) return;
    if (activeTab === "applied_outreach" && !roleName.trim()) {
      alert("Please enter the role name before generating.");
      return;
    }
    setLoading((l) => ({ ...l, [key]: true }));
    try {
      const res = await generateMessage({
        recipient_profile: profile.raw_text,
        recipient_type: profile.recipient_type,
        message_type: key as Parameters<typeof generateMessage>[0]["message_type"],
        jd_text: profile.jd_text || "",
        role_name: roleName.trim(),
      });
      setResults((r) => ({ ...r, [key]: res.result }));
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      alert(`Generation failed: ${e?.response?.data?.detail || e?.message || "Unknown error"}`);
    } finally {
      setLoading((l) => ({ ...l, [key]: false }));
    }
  };

  return (
    <div className="card overflow-hidden">
      {/* Tab headers */}
      <div className="flex border-b border-[#E2E8F0] bg-[#F8FAFC]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-[#1B3A6B] text-[#1B3A6B] bg-white"
                : "border-transparent text-[#64748B] hover:text-[#1B3A6B]"
            }`}
          >
            <span className="hidden sm:inline mr-1">{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">
        {/* Cold email sub-tabs */}
        {activeTab === "cold_email" && (
          <div className="flex gap-2">
            {COLD_SUBTYPES.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setColdSubtype(sub.id)}
                className={`flex-1 border rounded-lg px-3 py-2 text-left transition-all ${
                  coldSubtype === sub.id
                    ? "border-[#1B3A6B] bg-[#f0f4fb]"
                    : "border-[#E2E8F0] hover:border-[#1B3A6B]/40"
                }`}
              >
                <p className="text-sm font-medium text-[#0F172A]">{sub.label}</p>
                <p className="text-xs text-[#94A3B8]">{sub.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* Applied outreach sub-tabs + role input */}
        {activeTab === "applied_outreach" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              {APPLIED_SUBTYPES.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setAppliedSubtype(sub.id)}
                  className={`flex-1 border rounded-lg px-3 py-2 text-left transition-all ${
                    appliedSubtype === sub.id
                      ? "border-[#1B3A6B] bg-[#f0f4fb]"
                      : "border-[#E2E8F0] hover:border-[#1B3A6B]/40"
                  }`}
                >
                  <p className="text-sm font-medium text-[#0F172A]">{sub.label}</p>
                  <p className="text-xs text-[#94A3B8]">{sub.desc}</p>
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                Role Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. AI Engineer, ML Engineer, Data Scientist"
                className="w-full border border-[#CBD5E1] rounded-lg px-3 py-2 text-sm text-[#334155] placeholder-[#94A3B8] focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20 transition-all"
              />
            </div>
          </div>
        )}

        {/* JD warning for cover letter */}
        {activeTab === "cover_letter" && !profile.jd_text && (
          <JdWarning />
        )}

        {/* Generate button */}
        {!results[currentKey] && !loading[currentKey] && (
          <button
            onClick={() => generate(currentKey)}
            className="btn-primary w-full"
          >
            Generate{" "}
            {activeTab === "cold_email"
              ? COLD_SUBTYPES.find((s) => s.id === coldSubtype)?.label + " Email"
              : activeTab === "applied_outreach"
              ? APPLIED_SUBTYPES.find((s) => s.id === appliedSubtype)?.label + " Message"
              : TABS.find((t) => t.id === activeTab)?.label}
          </button>
        )}

        {loading[currentKey] && <LoadingSpinner />}

        {results[currentKey] && !loading[currentKey] && (
          <>
            <MessageBox
              result={results[currentKey]}
              messageType={currentKey}
              profile={profile}
              onSave={() => setSavedCount((c) => c + 1)}
            />
            <button
              onClick={() => generate(currentKey)}
              className="text-xs text-[#64748B] hover:text-[#1B3A6B] underline"
            >
              Regenerate
            </button>
          </>
        )}
      </div>
    </div>
  );
}
