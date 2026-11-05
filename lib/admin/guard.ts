import { headers } from "next/headers";
import { isAdminRequest } from "./auth";

/** Re-check admin auth inside server actions (defence in depth behind proxy.ts). */
export async function requireAdmin(): Promise<void> {
  const h = await headers();
  if (!(await isAdminRequest(h.get("authorization")))) throw new Error("Unauthorized");
}
