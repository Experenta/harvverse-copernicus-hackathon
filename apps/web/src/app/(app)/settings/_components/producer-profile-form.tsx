"use client";

import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { CheckCircle, Loader2 } from "lucide-react";

import { Button } from "@harvverse-copernicus-hackathon/ui/components/button";
import { Input } from "@harvverse-copernicus-hackathon/ui/components/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@harvverse-copernicus-hackathon/ui/components/form";

import { trpc } from "@/utils/trpc";

const optionalText = z.string().trim().optional().or(z.literal(""));

const profileSchema = z.object({
  legalFullName: z.string().trim().min(2, "Required"),
  dni: z.string().trim().min(5, "Required"),
  ihcafeNumber: optionalText,
  whatsappPhone: optionalText,
  residenceDepartment: optionalText,
  residenceMunicipality: optionalText,
  coffeeExperienceYears: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().int().min(0).optional(),
  ),
  currentCertifications: optionalText,
});

type ProfileInput = z.input<typeof profileSchema>;

type ProducerProfileInitialData = {
  legalFullName?: string | null;
  dni?: string | null;
  ihcafeNumber?: string | null;
  whatsappPhone?: string | null;
  residenceDepartment?: string | null;
  residenceMunicipality?: string | null;
  coffeeExperienceYears?: number | null;
  currentCertifications?: string[] | null;
};

function cleanText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function certificationsToText(value: string[] | null | undefined) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function parseCertifications(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function ProducerProfileForm({
  initialData,
}: {
  initialData?: ProducerProfileInitialData | null;
}) {
  const t = useTranslations("profile");
  const queryClient = useQueryClient();

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      legalFullName: "",
      dni: "",
      ihcafeNumber: "",
      whatsappPhone: "",
      residenceDepartment: "",
      residenceMunicipality: "",
      coffeeExperienceYears: "",
      currentCertifications: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        legalFullName: initialData.legalFullName ?? "",
        dni: initialData.dni ?? "",
        ihcafeNumber: initialData.ihcafeNumber ?? "",
        whatsappPhone: initialData.whatsappPhone ?? "",
        residenceDepartment: initialData.residenceDepartment ?? "",
        residenceMunicipality: initialData.residenceMunicipality ?? "",
        coffeeExperienceYears: initialData.coffeeExperienceYears ?? "",
        currentCertifications: certificationsToText(initialData.currentCertifications),
      });
    }
  }, [initialData, form]);

  const upsertProfile = useMutation(
    trpc.users.upsertProducerProfile.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.users.me.queryKey(),
        });
        toast.success(t("updated"));
      },
    }),
  );

  function onSubmit(values: ProfileInput) {
    upsertProfile.mutate({
      legalFullName: values.legalFullName.trim(),
      dni: values.dni.trim(),
      ihcafeNumber: cleanText(values.ihcafeNumber),
      whatsappPhone: cleanText(values.whatsappPhone),
      residenceDepartment: cleanText(values.residenceDepartment),
      residenceMunicipality: cleanText(values.residenceMunicipality),
      coffeeExperienceYears:
        values.coffeeExperienceYears === "" ? undefined : Number(values.coffeeExperienceYears),
      currentCertifications: parseCertifications(values.currentCertifications),
    });
  }

  const inputClasses = "harv-input";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-left">
        <FormField
          control={form.control}
          name="legalFullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/80">{t("legal_full_name")}</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Juan Perez" className={inputClasses} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="dni"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/80">{t("dni")}</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 0801-1990-12345" className={inputClasses} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ihcafeNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/80">{t("ihcafe_id")}</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 1234567" className={inputClasses} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="whatsappPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/80">{t("whatsapp_phone")}</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., +50499999999" className={inputClasses} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="coffeeExperienceYears"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/80">{t("coffee_experience_years")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="residenceDepartment"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/80">{t("residence_department")}</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Intibuca" className={inputClasses} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="residenceMunicipality"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white/80">{t("residence_municipality")}</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., La Esperanza" className={inputClasses} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="currentCertifications"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white/80">{t("current_certifications")}</FormLabel>
              <FormControl>
                <Input placeholder="e.g., IHCAFE, Organic, Fair Trade" className={inputClasses} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={upsertProfile.isPending}
          className="h-12 w-full bg-primary font-black uppercase tracking-widest text-[#001020] hover:bg-primary/90"
        >
          {upsertProfile.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 size-4" />
          )}
          {upsertProfile.isPending ? t("saving") : t("save_btn")}
        </Button>
      </form>
    </Form>
  );
}
