"use client";

import { useEffect } from "react";
import type { Route } from "next";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { ArrowLeft, CheckCircle, HelpCircle, Info, Lock, Loader2, ImagePlus } from "lucide-react";

import { GlassCard } from "@harvverse-copernicus-hackathon/ui/components/glass-card";
import { Button } from "@harvverse-copernicus-hackathon/ui/components/button";
import { Input } from "@harvverse-copernicus-hackathon/ui/components/input";
import { Textarea } from "@harvverse-copernicus-hackathon/ui/components/textarea";
import { Skeleton } from "@harvverse-copernicus-hackathon/ui/components/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@harvverse-copernicus-hackathon/ui/components/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@harvverse-copernicus-hackathon/ui/components/form";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@harvverse-copernicus-hackathon/ui/components/tooltip";

import { computeEarnings, formatUsd, formatUsdFromCents, formatUsdPrecise } from "@/lib/format";
import { useCurrentUser } from "@/hooks/use-auth";
import { queryClient, trpc } from "@/utils/trpc";

const editLotSchema = z.object({
  // Section B — marketing
  descriptiveName: z.string().optional(),
  variety: z.string().trim().max(100).optional(),
  varietiesComposition: z.string().optional(),
  process: z.string().optional(),
  processingMethod: z.string().optional(),
  profile: z.string().trim().optional(),
  summary: z.string().trim().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  scaScoreTenths: z.coerce.number().int().min(0).max(1000).optional(),
  // Section C — agronomic
  numTrees: z.coerce.number().int().min(0).optional(),
  plantAgeYears: z.coerce.number().int().min(0).optional(),
  averagePlantAgeYears: z.coerce.number().int().min(0).optional(),
  areaManzanas: z.coerce.number().min(0).optional(),
  harvestYear: z.coerce.number().int().min(2000).max(2100).optional(),
  cycleNotes: z.string().trim().optional(),
  renovationInProgress: z.boolean().optional(),
  newVariety: z.string().optional(),
  renovationPercent: z.coerce.number().min(0).max(100).optional(),
  renovationStartYear: z.coerce.number().int().optional(),
  managementType: z.string().optional(),
  previousProductionQq: z.coerce.number().min(0).optional(),
  productionDataYear: z.coerce.number().int().optional(),
  rustLastCycle: z.string().optional(),
  borerLastCycle: z.string().optional(),
  fertilizedLastCycle: z.boolean().optional(),
  availableForCoinvestment: z.boolean().optional(),
  acceptsSplit6040: z.boolean().optional(),
  minimumPriceCentsPerLb: z.coerce.number().int().min(0).optional(),
  lotObservations: z.string().optional(),

  ticketUsd: z.coerce.number().positive().min(1000),
  pricePerLbUsd: z.coerce.number().positive(),
  priceFloorPerLbUsd: z.coerce.number().positive(),
  agronomicCostUsd: z.coerce.number().positive(),
  projectedYieldQq: z.coerce.number().positive(),
  yieldCapQq: z.coerce.number().positive(),
  farmerSharePct: z.coerce.number().min(1).max(99),
});

type EditLotInput = z.input<typeof editLotSchema>;
type EditLotValues = z.output<typeof editLotSchema>;

function parseVarietiesComposition(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    return { notes: trimmed };
  }
}

const inputClasses = "bg-black/20 border-white/10 text-white placeholder:text-gray-600";

const COFFEE_VARIETIES = [
  "Geisha", "Bourbon", "Catuai", "Pacamara", "Typica", "Caturra", "Parainema", "Other",
];

async function sha256Hex(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const buf = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function FarmerLotEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ lotId: string }>();
  const lotId = Number(params.lotId);
  const lotIdValid = Number.isFinite(lotId) && lotId > 0;
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const t = useTranslations("lot");
  const tc = useTranslations("common");
  const tLF = useTranslations("lot_financial");

  const { data: lot, isLoading: lotLoading } = useQuery(
    trpc.lots.byId.queryOptions({ id: lotId }, { enabled: lotIdValid }),
  );

  const updateLot = useMutation(
    trpc.lots.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.lots.byId.queryKey({ id: lotId }),
        });
        toast.success(t("updated"));
        router.push(`/dashboard/farmer/lots/${lotId}` as Route);
      },
    }),
  );

  const createPlan = useMutation(trpc.plans.create.mutationOptions());
  const updatePlan = useMutation(trpc.plans.update.mutationOptions());
  const updateStatus = useMutation(trpc.lots.updateStatus.mutationOptions());

  const form = useForm<EditLotInput, unknown, EditLotValues>({
    resolver: zodResolver(editLotSchema),
    defaultValues: {
      descriptiveName: "",
      variety: "",
      varietiesComposition: "",
      process: "",
      processingMethod: "",
      profile: "",
      summary: "",
      coverImageUrl: "",
      scaScoreTenths: undefined,
      numTrees: undefined,
      plantAgeYears: undefined,
      averagePlantAgeYears: undefined,
      areaManzanas: undefined,
      harvestYear: undefined,
      cycleNotes: "",
      renovationInProgress: false,
      newVariety: "",
      renovationPercent: undefined,
      renovationStartYear: undefined,
      managementType: "",
      previousProductionQq: undefined,
      productionDataYear: undefined,
      rustLastCycle: "",
      borerLastCycle: "",
      fertilizedLastCycle: false,
      availableForCoinvestment: true,
      acceptsSplit6040: true,
      minimumPriceCentsPerLb: undefined,
      lotObservations: "",
      ticketUsd: 3425,
      pricePerLbUsd: 3.5,
      priceFloorPerLbUsd: 2.5,
      agronomicCostUsd: 1490,
      projectedYieldQq: 6,
      yieldCapQq: 8,
      farmerSharePct: 60,
    },
  });

  useEffect(() => {
    if (!lot) return;
    const plan = lot.plans?.find((p) => p.status === "approved_for_demo") ?? lot.plans?.[0];
    form.reset({
      descriptiveName: lot.descriptiveName ?? "",
      variety: lot.variety ?? "",
      varietiesComposition: lot.varietiesComposition ? JSON.stringify(lot.varietiesComposition) : "",
      process: lot.process ?? "",
      processingMethod: lot.processingMethod ?? "",
      profile: lot.profile ?? "",
      summary: lot.summary ?? "",
      coverImageUrl: lot.coverImages?.[0] ?? "",
      scaScoreTenths: lot.scaScoreTenths ?? undefined,
      numTrees: lot.numTrees ?? undefined,
      plantAgeYears: lot.plantAgeYears ?? undefined,
      averagePlantAgeYears: lot.averagePlantAgeYears ?? undefined,
      areaManzanas: lot.areaManzanas != null ? Number(lot.areaManzanas) : undefined,
      harvestYear: lot.harvestYear ?? undefined,
      cycleNotes: lot.cycleNotes ?? "",
      renovationInProgress: lot.renovationInProgress ?? false,
      newVariety: lot.newVariety ?? "",
      renovationPercent: lot.renovationPercent != null ? Number(lot.renovationPercent) : undefined,
      renovationStartYear: lot.renovationStartYear ?? undefined,
      managementType: lot.managementType ?? "",
      previousProductionQq: lot.previousProductionQq != null ? Number(lot.previousProductionQq) : undefined,
      productionDataYear: lot.productionDataYear ?? undefined,
      rustLastCycle: lot.rustLastCycle ?? "",
      borerLastCycle: lot.borerLastCycle ?? "",
      fertilizedLastCycle: lot.fertilizedLastCycle ?? false,
      availableForCoinvestment: lot.availableForCoinvestment ?? true,
      acceptsSplit6040: lot.acceptsSplit6040 ?? true,
      minimumPriceCentsPerLb: lot.minimumPriceCentsPerLb ?? undefined,
      lotObservations: lot.lotObservations ?? "",
      ticketUsd: plan ? plan.ticketCents / 100 : 3425,
      pricePerLbUsd: plan ? plan.priceCentsPerLb / 100 : 3.5,
      priceFloorPerLbUsd: plan?.priceFloorCentsPerLb != null ? plan.priceFloorCentsPerLb / 100 : 2.5,
      agronomicCostUsd: plan ? plan.agronomicCostCents / 100 : 1490,
      projectedYieldQq: plan ? plan.projectedYieldY1TenthsQq / 10 : 6,
      yieldCapQq: plan ? plan.yieldCapY1TenthsQq / 10 : 8,
      farmerSharePct: plan ? plan.splitFarmerBps / 100 : 60,
    });
  }, [lot]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchParams.get("section") !== "terms") return;
    document.getElementById("investment-terms")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [searchParams]);

  useEffect(() => {
    if (userLoading) return;
    if (user && user.role !== "farmer") {
      router.replace("/dashboard/player");
    }
  }, [user, userLoading, router]);

  if (!userLoading && user && user.role !== "farmer") {
    return null;
  }

  const isLoading = userLoading || lotLoading;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!lot) {
    return (
      <GlassCard className="p-12 text-center border-primary/20">
        <p className="text-gray-400">{t("not_found")}</p>
      </GlassCard>
    );
  }

  const isAvailable = lot.status === "available";
  const activePlan = lot.plans?.find((p) => p.status === "approved_for_demo") ?? lot.plans?.[0];
  const canEditMarketing = lot.status === "available" || lot.status === "draft";
  const canEditTerms = lot.status === "draft" || !activePlan;
  const planActionPending = createPlan.isPending || updatePlan.isPending || updateStatus.isPending;
  const farmerSharePct = form.watch("farmerSharePct");
  const projectedYieldQq = form.watch("projectedYieldQq");
  const pricePerLbUsd = form.watch("pricePerLbUsd");
  const agronomicCostUsd = form.watch("agronomicCostUsd");
  const earnings = computeEarnings({
    projectedYieldQq: Number(projectedYieldQq) || 0,
    pricePerLbUsd: Number(pricePerLbUsd) || 0,
    agronomicCostUsd: Number(agronomicCostUsd) || 0,
    farmerSharePct: Number(farmerSharePct) || 0,
  });

  function onSubmit(values: EditLotValues) {
    updateLot.mutate({
      lotId,
      descriptiveName: values.descriptiveName || undefined,
      variety: values.variety || undefined,
      varietiesComposition: parseVarietiesComposition(values.varietiesComposition),
      process: values.process || undefined,
      processingMethod: values.processingMethod || undefined,
      profile: values.profile || undefined,
      summary: values.summary || undefined,
      coverImages: values.coverImageUrl ? [values.coverImageUrl] : [],
      scaScoreTenths: values.scaScoreTenths,
      numTrees: values.numTrees,
      plantAgeYears: values.plantAgeYears,
      averagePlantAgeYears: values.averagePlantAgeYears,
      areaManzanas: values.areaManzanas,
      harvestYear: values.harvestYear,
      cycleNotes: values.cycleNotes || undefined,
      renovationInProgress: values.renovationInProgress,
      newVariety: values.newVariety || undefined,
      renovationPercent: values.renovationPercent,
      renovationStartYear: values.renovationStartYear,
      managementType: values.managementType || undefined,
      previousProductionQq: values.previousProductionQq,
      productionDataYear: values.productionDataYear,
      rustLastCycle: values.rustLastCycle || undefined,
      borerLastCycle: values.borerLastCycle || undefined,
      fertilizedLastCycle: values.fertilizedLastCycle,
      availableForCoinvestment: values.availableForCoinvestment,
      acceptsSplit6040: values.acceptsSplit6040,
      minimumPriceCentsPerLb: values.minimumPriceCentsPerLb,
      lotObservations: values.lotObservations || undefined,
    });
  }

  async function publishWithTerms(values: EditLotValues) {
    if (!lot) return;
    const rawCode = lot.code ?? String(lot.id);
    const planCode = activePlan?.planCode ?? `${rawCode}-${new Date().getFullYear()}`.slice(0, 30);
    const planValues = {
      lotId: lot.id,
      lotCode: lot.code ?? null,
      planCode,
      status: "approved_for_demo" as const,
      validatedByName: activePlan?.validatedByName ?? "Pending validation",
      ticketCents: Math.round(values.ticketUsd * 100),
      priceCentsPerLb: Math.round(values.pricePerLbUsd * 100),
      priceFloorCentsPerLb: Math.round(values.priceFloorPerLbUsd * 100),
      agronomicCostCents: Math.round(values.agronomicCostUsd * 100),
      projectedYieldY1TenthsQq: Math.round(values.projectedYieldQq * 10),
      yieldCapY1TenthsQq: Math.round(values.yieldCapQq * 10),
      splitFarmerBps: Math.round(values.farmerSharePct * 100),
      splitPartnerBps: Math.round((100 - values.farmerSharePct) * 100),
    };
    const planHash = await sha256Hex(JSON.stringify(planValues));

    if (activePlan) {
      await updatePlan.mutateAsync({
        id: activePlan.id,
        ...planValues,
        planHash,
      });
    } else {
      await createPlan.mutateAsync({
        ...planValues,
        planHash,
      });
    }

    await updateStatus.mutateAsync({ id: lot.id, status: "available" });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.lots.byId.queryKey({ id: lot.id }) }),
      queryClient.invalidateQueries({ queryKey: trpc.lots.list.queryKey() }),
    ]);
    toast.success(t("published"));
    router.push(`/dashboard/farmer/lots/${lot.id}` as Route);
  }

  return (
    <div className="px-4 md:px-0">
      <Button
        variant="ghost"
        className="mb-6 text-white/70 px-0 md:px-4"
        onClick={() =>
          router.push(`/dashboard/farmer/lots/${lotId}` as Route)
        }
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {tc("back")}
      </Button>

      <div className="max-w-2xl mx-auto space-y-6">
        <GlassCard className="p-6 md:p-8 border-primary/20 bg-white/[0.03]">
          <h1 className="font-trenda text-2xl md:text-3xl font-bold text-white mb-1">{t("edit_title")}</h1>
          <p className="text-white/40 text-sm mb-8">
            {lot.code ?? t("lot_id", { id: lot.id })}
          </p>

          {/* Section A — Agreement Terms (always read-only) */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <h2 className="text-base font-bold text-primary">{t("section_a_title")}</h2>
            </div>
            <p className="text-xs text-white/40 mb-5 leading-relaxed">{t("section_a_info")}</p>
            {activePlan ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">{tLF("terms_ticket")}</p>
                  <p className="text-white font-bold">{formatUsdFromCents(activePlan.ticketCents)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">{tLF("terms_price")}</p>
                  <p className="text-white font-bold">{formatUsdFromCents(activePlan.priceCentsPerLb)}/lb</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">{tLF("terms_farmer_share")}</p>
                  <p className="text-white font-bold">{((activePlan.splitFarmerBps ?? 0) / 100).toFixed(1)}%</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">{tLF("terms_partner_share")}</p>
                  <p className="text-white font-bold">{((activePlan.splitPartnerBps ?? 0) / 100).toFixed(1)}%</p>
                </div>
              </div>
            ) : (
              <p className="text-white/40 text-sm italic">{tLF("no_plan")}</p>
            )}
          </div>

          <div className="border-t border-white/5 my-8" />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Section B — Marketing */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {canEditMarketing ? (
                    <h2 className="text-base font-bold text-white">{t("section_b_title")}</h2>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-yellow-400 shrink-0" />
                      <h2 className="text-base font-bold text-yellow-400">{t("section_b_title")}</h2>
                    </>
                  )}
                </div>
                {!canEditMarketing && (
                  <p className="text-xs text-yellow-500/60 leading-relaxed mb-4">
                    {t("section_b_locked", { status: lot.status })}
                  </p>
                )}
              </div>

              {canEditMarketing ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="descriptiveName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">{t("descriptive_name")}</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Lote de la Cascada" className={inputClasses} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="variety"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">{t("variety")}</FormLabel>
                          <FormControl>
                            <Select value={typeof field.value === "string" ? field.value : undefined} onValueChange={field.onChange}>
                              <SelectTrigger className={inputClasses}>
                                <SelectValue placeholder="e.g., Geisha" />
                              </SelectTrigger>
                              <SelectContent>
                                {COFFEE_VARIETIES.map((v) => (
                                  <SelectItem key={v} value={v}>
                                    {v}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="varietiesComposition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">{t("varieties_composition")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder='e.g., {"Bourbon": 60, "Catuai": 40}'
                              className={inputClasses}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="process"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">{t("process")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Washed"
                              className={inputClasses}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="processingMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">{t("processing_method")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Solar dry bed"
                              className={inputClasses}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="scaScoreTenths"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">{t("sca_score")}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className={inputClasses}
                              placeholder="e.g., 875"
                              {...field}
                              value={(field.value as string | number | undefined) ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="profile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">{t("tasting_profile")}</FormLabel>
                        <FormControl>
                          <Textarea
                            className="bg-black/20 border-white/10 text-white placeholder:text-white/20 text-sm"
                            placeholder="e.g., Jasmine, peach, brown sugar..."
                            {...field}
                            value={typeof field.value === "string" ? field.value : (field.value ?? "")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">{t("summary")}</FormLabel>
                        <FormControl>
                          <Textarea
                            className="bg-black/20 border-white/10 text-white placeholder:text-white/20 text-sm"
                            placeholder={t("summary_placeholder")}
                            {...field}
                            value={typeof field.value === "string" ? field.value : (field.value ?? "")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="coverImageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">{t("cover_image_url")}</FormLabel>
                        <FormControl>
                          <Input
                            className={inputClasses}
                            placeholder={t("cover_image_placeholder")}
                            {...field}
                            value={typeof field.value === "string" ? field.value : (field.value ?? "")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm opacity-60">
                  {lot.variety && (
                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">{t("variety")}</p>
                      <p className="text-white font-medium">{lot.variety}</p>
                    </div>
                  )}
                  {lot.scaScoreTenths != null && (
                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">{t("sca_score")}</p>
                      <p className="text-white font-medium">{(lot.scaScoreTenths / 10).toFixed(1)}</p>
                    </div>
                  )}
                </div>
              )}

              <div id="investment-terms" className="scroll-mt-8 rounded-xl border border-primary/20 bg-primary/5 p-6">
                <div className="mb-6 flex items-center gap-2">
                  {canEditTerms ? (
                    <Info className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-white/45 shrink-0" />
                  )}
                  <h2 className="font-trenda text-base font-bold text-white uppercase tracking-wider">
                    {tLF("section_title")}
                  </h2>
                </div>

                {canEditTerms ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                      <FormField
                        control={form.control}
                        name="ticketUsd"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/80">{tLF("ticket_label")}</FormLabel>
                            <FormControl>
                              <Input type="number" step="1" className={inputClasses} {...field} value={typeof field.value === "number" ? field.value : ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="agronomicCostUsd"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 text-white/80">
                              {tLF("agro_cost_label")}
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3.5 w-3.5 text-white/45" />
                                </TooltipTrigger>
                                <TooltipContent>{tLF("tooltip_agro_cost")}</TooltipContent>
                              </Tooltip>
                            </FormLabel>
                            <FormControl>
                              <Input type="number" step="1" className={inputClasses} {...field} value={typeof field.value === "number" ? field.value : ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pricePerLbUsd"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/80">{tLF("price_label")}</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" className={inputClasses} {...field} value={typeof field.value === "number" ? field.value : ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priceFloorPerLbUsd"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1 text-white/80">
                              {tLF("price_floor_label")}
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3.5 w-3.5 text-white/45" />
                                </TooltipTrigger>
                                <TooltipContent>{tLF("tooltip_price_floor")}</TooltipContent>
                              </Tooltip>
                            </FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" className={inputClasses} {...field} value={typeof field.value === "number" ? field.value : ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="projectedYieldQq"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/80">{tLF("yield_label")}</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" className={inputClasses} {...field} value={typeof field.value === "number" ? field.value : ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="yieldCapQq"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/80">{tLF("yield_cap_label")}</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.1" className={inputClasses} {...field} value={typeof field.value === "number" ? field.value : ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="farmerSharePct"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/80">{tLF("farmer_share_label")}</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" max="99" step="1" className={inputClasses} {...field} value={typeof field.value === "number" ? field.value : ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex flex-col justify-center bg-black/20 rounded-lg p-3 border border-white/5">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">{tLF("partner_share_info")}</p>
                        <p className="font-trenda text-xl font-black text-primary">
                          {(100 - (Number(farmerSharePct) || 0)).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white/50 text-xs uppercase tracking-wider">{tLF("earnings_gross")}</span>
                        <span className="text-white font-bold">{formatUsd(earnings.grossIncomeUsd)}</span>
                      </div>
                      <p className="text-[10px] text-white/30 italic mb-4">
                        {tLF("gross_income_line", {
                          value: (Number(projectedYieldQq) || 0).toFixed(1),
                          price: formatUsdPrecise(Number(pricePerLbUsd) || 0).replace("$", ""),
                        })}
                      </p>
                      <div className="flex justify-between items-center border-t border-white/5 pt-4 bg-emerald-500/10 -mx-4 px-4 py-3 rounded-b-lg">
                        <span className="text-emerald-300 font-bold text-xs uppercase tracking-wider">
                          {tLF("earnings_your_share", { pct: (Number(farmerSharePct) || 0).toFixed(0) })}
                        </span>
                        <span className="text-emerald-300 font-black text-lg">{formatUsd(earnings.farmerEarningsUsd)}</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      disabled={planActionPending}
                      className="mt-6 w-full bg-primary text-[#001020] font-black uppercase tracking-widest h-12 shadow-xl shadow-primary/10 transition-all"
                      onClick={form.handleSubmit(publishWithTerms)}
                    >
                      {planActionPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      {activePlan ? t("save_publish") : t("create_plan_btn")}
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-white/40 italic">{t("section_a_info")}</p>
                )}
              </div>

              <div className="border-t border-white/5 my-4" />

              {/* Section C — Agronomic Notes (always editable) */}
              <div>
                <h2 className="text-base font-bold text-white uppercase tracking-wider mb-6">{t("section_c_title")}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numTrees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">{t("num_trees")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className={inputClasses}
                          {...field}
                          value={(field.value as string | number | undefined) ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plantAgeYears"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">{t("plant_age")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className={inputClasses}
                          {...field}
                          value={(field.value as string | number | undefined) ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="areaManzanas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">{t("area_manzanas")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          disabled
                          className={inputClasses}
                          {...field}
                          value={(field.value as string | number | undefined) ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="harvestYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">{t("harvest_year")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className={inputClasses}
                          {...field}
                          value={(field.value as string | number | undefined) ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="cycleNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white/80">{t("cycle_notes")}</FormLabel>
                    <FormControl>
                      <Textarea
                        className="bg-black/20 border-white/10 text-white placeholder:text-white/20 text-sm"
                        placeholder={t("cycle_notes_placeholder")}
                        rows={4}
                        {...field}
                        value={typeof field.value === "string" ? field.value : (field.value ?? "")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 space-y-4">
                <div className="border-b border-white/10 pb-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                    Renovation Status
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="renovationInProgress"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-white/10 p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-white/80">
                            {t("renovation_in_progress")}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="newVariety"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">{t("new_variety")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Parainema"
                            className={inputClasses}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="renovationPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">{t("renovation_percent")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 20"
                            className={inputClasses}
                            {...field}
                            value={(field.value as string | number | undefined) ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="renovationStartYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">{t("renovation_start_year")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 2022"
                            className={inputClasses}
                            {...field}
                            value={(field.value as string | number | undefined) ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 space-y-4">
                <div className="border-b border-white/10 pb-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                    Management & Production
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="managementType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">{t("management_type")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Organic, conventional"
                            className={inputClasses}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="previousProductionQq"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">{t("previous_production_qq")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g., 45.5"
                            className={inputClasses}
                            {...field}
                            value={(field.value as string | number | undefined) ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="productionDataYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">{t("production_data_year")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 2023"
                            className={inputClasses}
                            {...field}
                            value={(field.value as string | number | undefined) ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rustLastCycle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">{t("rust_last_cycle")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Low, 5%"
                            className={inputClasses}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="borerLastCycle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">{t("borer_last_cycle")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., None"
                            className={inputClasses}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="fertilizedLastCycle"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-white/10 p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-white/80">
                          {t("fertilized_last_cycle")}
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 space-y-4">
                <div className="border-b border-white/10 pb-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                    Business & Investment
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="availableForCoinvestment"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-white/10 p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-white/80">
                            {t("available_for_coinvestment")}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="acceptsSplit6040"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-white/10 p-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-white/80">
                            {t("accepts_split_6040")}
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="minimumPriceCentsPerLb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">{t("minimum_price_cents_per_lb")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 250"
                          className={inputClasses}
                          {...field}
                          value={(field.value as string | number | undefined) ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lotObservations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">{t("lot_observations")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about the lot..."
                          className="bg-black/20 border-white/10 text-white placeholder:text-white/35 min-h-[80px] text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={updateLot.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-[#001020] font-black uppercase tracking-widest h-12 shadow-xl shadow-primary/10 transition-all"
              >
                {updateLot.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {updateLot.isPending ? t("saving") : t("save_btn")}
              </Button>
            </form>
          </Form>
        </GlassCard>
      </div>
    </div>
  );
}
