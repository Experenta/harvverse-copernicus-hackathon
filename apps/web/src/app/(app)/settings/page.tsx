"use client";

import { Settings, UserCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { GlassCard } from "@harvverse-copernicus-hackathon/ui/components/glass-card";
import { useCurrentUser } from "@/hooks/use-auth";
import { ProducerProfileForm } from "./_components/producer-profile-form";
import { Skeleton } from "@harvverse-copernicus-hackathon/ui/components/skeleton";

export default function SettingsPage() {
  const tn = useTranslations("nav");
  const tc = useTranslations("common");
  const tp = useTranslations("profile");
  const { data: user, isLoading } = useCurrentUser();

  return (
    <div className="mx-auto max-w-4xl px-4 md:px-0">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-white">
          <Settings className="w-6 h-6 md:w-7 md:h-7 text-primary" />
          {tn("settings")}
        </h1>
      </header>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {user?.role === "farmer" && (
            <GlassCard className="p-6 md:p-8 border-primary/20 bg-white/[0.03]">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                  <UserCircle className="size-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{tp("title")}</h2>
                  <p className="text-sm text-white/40">{tp("description")}</p>
                </div>
              </div>
              <ProducerProfileForm initialData={user.producerProfile} />
            </GlassCard>
          )}

          <GlassCard className="p-8 md:p-12 text-center border-primary/20">
            <p className="text-white/70 text-base md:text-lg">{tc("coming_soon")}</p>
            <p className="text-white/40 text-xs md:text-sm mt-2">
              {tc("settings_placeholder")}
            </p>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
