"use client";

import type { ComponentType, ReactNode } from "react";
import { useState } from "react";
import { Check, Copy, HelpCircle } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@harvverse-copernicus-hackathon/ui/components/tooltip";

export function CopernicusSectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="group relative">
      <div className="flex items-center gap-2">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{title}</h2>
        {description ? (
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle
                className="size-3 text-primary/40 transition-colors group-hover:text-primary"
                aria-hidden="true"
              />
            </TooltipTrigger>
            <TooltipContent className="max-w-[240px] text-xs leading-relaxed">{description}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </div>
  );
}

export function CopernicusMetric({
  icon: Icon,
  label,
  value,
  description,
  size = "md",
  scale,
}: {
  icon?: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  description?: string;
  size?: "sm" | "md";
  scale?: {
    value: number | null | undefined;
    min: number;
    max: number;
    label?: string;
    tone?: "poor" | "moderate" | "good" | "excellent";
  };
}) {
  const pct =
    scale?.value == null || !Number.isFinite(scale.value)
      ? null
      : Math.max(
          0,
          Math.min(100, ((scale.value - scale.min) / (scale.max - scale.min)) * 100),
        );
  const toneClass = {
    poor: "bg-red-400",
    moderate: "bg-yellow-300",
    good: "bg-lime-300",
    excellent: "bg-primary",
  }[scale?.tone ?? "good"];

  return (
    <div className="rounded-xl border border-white/10 bg-transparent p-3 transition-colors hover:border-primary/25 hover:bg-primary/[0.03]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden text-white/30">
          {Icon ? <Icon className="size-3.5 shrink-0 text-primary/60" /> : null}
          <p className="truncate text-[9px] font-bold uppercase tracking-wider">{label}</p>
        </div>
        {description ? (
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="size-3 text-white/10 hover:text-primary/60" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] text-[11px] leading-relaxed">{description}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <p className={`mt-2 font-black text-white ${size === "sm" ? "text-base" : "text-xl"}`}>{value}</p>
      {scale ? (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            {pct != null ? (
              <div className={`h-full rounded-full ${toneClass}`} style={{ width: `${pct}%` }} />
            ) : null}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 text-[9px] font-bold uppercase tracking-wider text-white/25">
            <span>{scale.min}</span>
            {scale.label ? <span className="truncate text-primary/80">{scale.label}</span> : null}
            <span>{scale.max}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CopernicusStatusPill({
  icon: Icon,
  label,
  value,
  description,
  variant = "default",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  description?: string;
  variant?: "default" | "success" | "warning";
}) {
  const variantStyles = {
    default: "border-white/10 bg-transparent text-primary",
    success: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
    warning: "border-yellow-500/20 bg-yellow-500/5 text-yellow-400",
  };

  return (
    <div className={`rounded-xl border p-4 transition-all hover:bg-white/[0.05] ${variantStyles[variant]}`}>
      <div className="flex items-center gap-2">
        <Icon className="size-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
      </div>
      <p className="mt-2 text-lg font-bold text-white">{value}</p>
      {description ? (
        <p className="mt-2 text-[11px] leading-relaxed text-white/40">{description}</p>
      ) : null}
    </div>
  );
}

export function CopernicusProofRow({
  label,
  value,
  description,
  mono = false,
  copyValue,
}: {
  label: string;
  value: string;
  description?: string;
  mono?: boolean;
  copyValue?: string | null;
}) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
    if (!copyValue || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="group rounded-lg border border-white/10 bg-transparent px-3 py-2 transition-colors hover:border-primary/25 hover:bg-primary/[0.03]">
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-white/40">
          {label}
          {description ? (
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="size-2.5 text-white/10 group-hover:text-primary/40" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] text-[11px] leading-relaxed">{description}</TooltipContent>
            </Tooltip>
          ) : null}
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          <span className={`truncate text-xs ${mono ? "font-mono text-primary" : "font-bold text-white"}`}>
            {value}
          </span>
          {copyValue ? (
            <button
              type="button"
              aria-label={`Copy ${label}`}
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-transparent text-white/35 transition-colors hover:border-primary/30 hover:text-primary"
              onClick={() => void copyToClipboard()}
            >
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            </button>
          ) : null}
        </span>
      </div>
    </div>
  );
}

export function CopernicusCardShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
