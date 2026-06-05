export const config = { runtime: "nodejs" };

export default function handler(_request: Request): Response {
  return Response.json({
    ok: true,
    service: "sentinel-agent",
    channel: "gupshup",
    timestamp: new Date().toISOString(),
  });
}
