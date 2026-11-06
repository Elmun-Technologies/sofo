import { SHARE_CARD_RENDER } from "@/lib/site";
import { keyArtResponse, loadShareData, renderStory } from "../../../../og/_lib/share";

/** Instagram Story image 1080×1920 — /story/{edition}/{movie|tv}/{slug} (optional ".png" suffix). */
export async function GET(_req: Request, ctx: RouteContext<"/story/[edition]/[type]/[slug]">) {
  const { edition, type, slug } = await ctx.params;
  if (!SHARE_CARD_RENDER) return keyArtResponse(edition, type, slug, "poster");
  const data = await loadShareData(edition, type, slug);
  if (!data) return new Response("Not found", { status: 404 });
  return renderStory(data);
}
