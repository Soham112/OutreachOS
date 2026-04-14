"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadZone from "@/components/UploadZone";
import ProfileCard from "@/components/ProfileCard";
import { analyzeProfile, ProfileData } from "@/lib/api";

export default function UploadPage() {
  const router = useRouter();
  const [linkedinFile, setLinkedinFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const handleAnalyze = async () => {
    if (!linkedinFile) {
      setError("Please upload a LinkedIn profile PDF.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await analyzeProfile(linkedinFile, jdFile, jdText);
      setProfile(res.profile);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(
        e?.response?.data?.detail ||
          "Analysis failed. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (!profile) return;
    // Store profile in sessionStorage to share across pages
    sessionStorage.setItem("outreach_profile", JSON.stringify(profile));
    router.push("/generate");
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Upload & Analyze</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Upload a LinkedIn profile PDF to extract key info and generate personalized outreach.
        </p>
      </div>

      {/* Upload section */}
      <div className="card p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[#0F172A] mb-2">
            LinkedIn Profile PDF <span className="text-red-400">*</span>
          </label>
          <UploadZone
            label="Upload LinkedIn PDF"
            onFile={setLinkedinFile}
            file={linkedinFile}
            hint="Download from LinkedIn → More → Save to PDF"
          />
        </div>

        <div className="border-t border-[#F1F5F9] pt-4">
          <label className="block text-sm font-semibold text-[#0F172A] mb-1">
            Job Description{" "}
            <span className="text-xs font-normal text-[#94A3B8]">optional — makes messages more targeted</span>
          </label>
          <div className="grid sm:grid-cols-2 gap-3 mt-2">
            <UploadZone
              label="Upload JD PDF"
              onFile={setJdFile}
              file={jdFile}
              hint="Optional job description PDF"
            />
            <div className="flex flex-col">
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Or paste job description text here..."
                rows={6}
                className="flex-1 border border-[#CBD5E1] rounded-xl p-3 text-sm text-[#334155] placeholder-[#94A3B8] resize-none focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20 transition-all"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={!linkedinFile || loading}
          className="btn-primary w-full sm:w-auto"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2"/>
                <path d="M8 2a6 6 0 016 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Analyzing...
            </span>
          ) : (
            "Analyze Profile"
          )}
        </button>
      </div>

      {/* Profile result */}
      {profile && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#0F172A]">Extracted Profile</h2>
            <button onClick={handleProceed} className="btn-primary">
              Generate Outreach →
            </button>
          </div>
          <ProfileCard profile={profile} />
        </div>
      )}
    </div>
  );
}
