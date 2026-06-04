export type GupshupSendTemplateInput = {
  destination: string;
  templateId: string;
  params: string[];
  dryRun?: boolean;
};

export type GupshupRequestPreview = {
  url: string;
  method: "POST";
  contentType: "application/x-www-form-urlencoded";
  form: Record<string, string>;
};

export type GupshupSendTemplateResult = {
  ok: boolean;
  dryRun: boolean;
  messageId: string | null;
  destination: string;
  templateId: string;
  params: string[];
  /** Body que se enviaría a Gupshup (útil en Postman / webhook.site) */
  requestPreview: GupshupRequestPreview;
  error: string | null;
};
