import { SHARE_CARD_RENDER } from "@/lib/site";
import { keyArtResponse, loadShareData, renderOg } from "../../../_lib/share";

/** OG image 1200×630 — /og/{edition}/{movie|tv}/{slug} (optional ".png" suffix). */
export async function GET(_req: Request, ctx: RouteContext<"/og/[edition]/[type]/[slug]">) {
  const { edition, type, slug } = await ctx.params;
  if (!SHARE_CARD_RENDER) return keyArtResponse(edition, type, slug, "backdrop");
  const data = await loadShareData(edition, type, slug);
  if (!data) return new Response("Not found", { status: 404 });
  return renderOg(data);
}
