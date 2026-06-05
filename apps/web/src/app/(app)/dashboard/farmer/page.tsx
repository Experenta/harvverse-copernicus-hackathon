"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, ArrowRight, CheckCircle2, Coins, FileText, Leaf, Plus, Sprout } from "lucide-react";

import { GlassCard } from "@harvverse-copernicus-hackathon/ui/components/glass-card";
import { Button } from "@harvverse-copernicus-hackathon/ui/components/button";
import { Skeleton } from "@harvverse-copernicus-hackathon/ui/components/skeleton";
import { useCurrentUser } from "@/hooks/use-auth";
import { trpc } from "@/utils/trpc";
import { FarmCard } from "@/components/farm-card";
import { formatCarbon } from "@/lib/carbon-ledger";
import { buildCarbonCreditPortfolio } from "@/lib/carbon-portfolio";

import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function FarmerDashboardPage() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const t = useTranslations("dashboard");
  const tf = useTranslations("farm");
  const [ledgerRefresh, setLedgerRefresh] = useState(0);

  const {
    data: farms,
    isLoading: farmsLoading,
    isError: farmsError,
  } = useQuery(
    trpc.farms.list.queryOptions(
      { farmerId: user?.id },
      { enabled: !!user },
    ),
  );

  const isLoading = userLoading || farmsLoading;
  const farmsToShow = farms ?? [];
  useEffect(() => {
    if (!farmsLoading) setLedgerRefresh(Date.now());
  }, [farmsLoading, farms]);

  const carbonPortfolio = useMemo(
    () =>
      buildCarbonCreditPortfolio(farmsToShow, (storageKey) =>
        typeof window === "undefined" ? null : window.localStorage.getItem(storageKey),
      ),
    [farmsToShow, ledgerRefresh],
  );
  const firstName = user?.displayName?.split(" ")[0] ?? "";
  const verifiedFarmsCount = farmsToShow.filter((farm) => farm.verified).length;
  const lotsCount = farmsToShow.reduce(
    (sum, farm) => sum + (farm.lots?.length ?? 0),
    0,
  );
  const availableLotsCount = farmsToShow.reduce(
    (sum, farm) =>
      sum + (farm.lots?.filter((lot) => lot.status === "available").length ?? 0),
    0,
  );

  useEffect(() => {
    if (userLoading) return;
    if (user && user.role !== "farmer") {
      router.replace("/dashboard/player");
    }
  }, [user, userLoading, router]);

  if (!userLoading && user && user.role !== "farmer") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-40" />
        </header>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-0 text-[#EEEEEE]">
      <header className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="font-trenda text-2xl md:text-3xl font-bold text-white">
            {farmsToShow.length > 0
              ? t("welcome_back", { name: firstName })
              : t("welcome", { name: user?.displayName ?? "" })}
          </h1>
          <p className="mt-1 md:mt-2 text-sm md:text-base text-white/70">
            {t("logged_as_farmer")}{" "}
            <span className="text-primary font-semibold">{t("farmer_role")}</span>
          </p>
        </div>
        <Button
          className="bg-primary hover:bg-primary/90 text-[#001020] w-full md:w-auto"
          onClick={() => router.push("/dashboard/farmer/create-farm")}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("new_farm")}
        </Button>
      </header>

      {farmsError ? (
        <GlassCard className="p-8 border-red-500/20">
          <p className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {t("failed_load_farms")}
          </p>
        </GlassCard>
      ) : !farms || farms.length === 0 ? (
        <GlassCard className="mx-auto flex max-w-xl flex-col items-center border-primary/20 bg-white/[0.03] p-8 text-center md:p-12">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Leaf className="w-8 h-8 md:w-10 md:h-10 text-primary" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-3">{tf("empty_title")}</h2>
          <p className="text-white/60 max-w-md mx-auto mb-8 text-sm md:text-base">
            {tf("empty_body")}
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-[#001020] w-full md:w-auto"
            onClick={() => router.push("/dashboard/farmer/create-farm")}
          >
            <Plus className="w-4 h-4 mr-2" />
            {tf("empty_cta")}
          </Button>
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-8">
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 md:gap-4"
          >
            <motion.div variants={item}>
              <GlassCard className="flex h-full items-center gap-3 border-primary/20 bg-white/[0.03] p-4 text-left transition-colors hover:border-primary/40">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-110">
                  <Sprout className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="stat-label mb-0.5 text-left text-[10px]">{t("my_farms")}</p>
                  <p className="stat-value text-left text-2xl leading-none">{farmsToShow.length}</p>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={item}>
              <GlassCard
                className="group flex h-full cursor-pointer items-center gap-3 border-fuchsia-300/20 bg-purple-950/25 p-4 text-left transition-colors hover:border-fuchsia-200/40"
                onClick={() => router.push("/dashboard/farmer/carbon-credits")}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-fuchsia-300/10 transition-transform group-hover:scale-110">
                  <Coins className="h-5 w-5 text-fuchsia-200" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="stat-label mb-0.5 text-left text-[10px]">{t("hc_balance")}</p>
                  <p className="stat-value truncate text-left text-2xl leading-none text-fuchsia-100">
                    {formatCarbon(carbonPortfolio.hcBalance)}
                  </p>
                  <p className="mt-0.5 text-left text-[9px] font-semibold uppercase tracking-[0.12em] text-fuchsia-100/45">
                    HC
                  </p>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={item}>
              <GlassCard className="flex h-full items-center gap-3 border-primary/20 bg-white/[0.03] p-4 text-left transition-colors hover:border-primary/40">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-110">
                  <Leaf className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="stat-label mb-0.5 text-left text-[10px]">{t("available_lots")}</p>
                  <p className="stat-value text-left text-2xl leading-none">{availableLotsCount}</p>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={item}>
              <GlassCard className="flex h-full items-center gap-3 border-primary/20 bg-white/[0.03] p-4 text-left transition-colors hover:border-primary/40">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-110">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="stat-label mb-0.5 text-left text-[10px]">{t("view_all_lots")}</p>
                  <p className="stat-value text-left text-2xl leading-none">{lotsCount}</p>
                </div>
              </GlassCard>
            </motion.div>

            <motion.div variants={item}>
              <GlassCard className="flex h-full items-center gap-3 border-primary/20 bg-white/[0.03] p-4 text-left transition-colors hover:border-primary/40">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-transform group-hover:scale-110">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="stat-label mb-0.5 text-left text-[10px]">{tf("verified")}</p>
                  <p className="stat-value text-left text-2xl leading-none">{verifiedFarmsCount}</p>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <h2 className="section-title text-xl md:text-2xl">{t("my_farms")}</h2>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => router.push("/dashboard/farmer/my-farms")}
                >
                  {t("view_all_farms")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => router.push("/dashboard/farmer/proposals")}
                >
                  {t("my_proposals")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {farms.map((farm) => (
                <FarmCard key={farm.id} farm={farm} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
