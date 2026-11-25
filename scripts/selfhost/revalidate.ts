/**
 * Last step of the self-hosted daily refresh (ADR 0003): ask the running app (same container) to drop
 * its ISR cache, so freshly imported titles show up at once. Needs INGEST_TOKEN (set in Coolify).
 */
const port = process.env.PORT ?? "3000";
const token = process.env.INGEST_TOKEN;

async function main() {
  if (!token) throw new Error("INGEST_TOKEN is not set");
  const res = await fetch(`http://127.0.0.1:${port}/api/revalidate`, { method: "POST", headers: { authorization: `Bearer ${token}` } });
  console.log(`[revalidate] ${res.status} ${await res.text()}`);
  if (!res.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

export {};
