"use client";
import { ProfileData } from "@/lib/api";

interface ProfileCardProps {
  profile: ProfileData;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const isRecruiter = profile.recipient_type === "RECRUITER";

  return (
    <div className="card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#0F172A]">{profile.name || "Unknown"}</h2>
          <p className="text-sm text-[#64748B] mt-0.5">
            {profile.current_role}
            {profile.company && (
              <> · <span className="font-medium text-[#1B3A6B]">{profile.company}</span></>
            )}
          </p>
        </div>
        <span className={isRecruiter ? "badge-recruiter" : "badge-hiring-manager"}>
          {isRecruiter ? "Recruiter" : "Hiring Manager"}
        </span>
      </div>

      {/* Experience */}
      {profile.experience_summary && (
        <div>
          <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Experience</h3>
          <p className="text-sm text-[#334155] leading-relaxed line-clamp-4">
            {profile.experience_summary}
          </p>
        </div>
      )}

      {/* Skills */}
      {profile.skills.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Detected Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.slice(0, 16).map((skill, i) => (
              <span key={i} className="tag">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* JD indicator */}
      {profile.jd_text && (
        <div className="flex items-center gap-2 text-xs text-[#2d6a2d] bg-[#f4f9f4] border border-[#8FAF8F]/40 rounded-lg px-3 py-2">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M4 7l2 2 4-4" stroke="#8FAF8F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Job description attached — messages will be tailored to the JD
        </div>
      )}
    </div>
  );
}
