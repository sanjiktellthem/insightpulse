export async function triggerMake(event: string, payload: unknown) {
  if (!process.env.MAKE_WEBHOOK_URL) return { ok: false, reason: "MAKE_WEBHOOK_URL not configured" };

  const res = await fetch(process.env.MAKE_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, payload }),
  });

  if (!res.ok) throw new Error(`Make webhook failed: ${res.status}`);
  return { ok: true };
}
