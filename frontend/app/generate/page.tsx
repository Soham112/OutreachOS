"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileCard from "@/components/ProfileCard";
import MessageTabs from "@/components/MessageTabs";
import { ProfileData } from "@/lib/api";

export default function GeneratePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("outreach_profile");
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch {
        router.push("/");
      }
    } else {
      router.push("/");
    }
  }, [router]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-48 text-[#64748B] text-sm">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Generate Outreach</h1>
          <p className="text-sm text-[#64748B] mt-1">
            Choose a message type and let Claude craft a personalized message.
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="btn-secondary text-sm py-2 whitespace-nowrap"
        >
          ← New Profile
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.6fr] gap-5 items-start">
        <ProfileCard profile={profile} />
        <MessageTabs profile={profile} />
      </div>
    </div>
  );
}
