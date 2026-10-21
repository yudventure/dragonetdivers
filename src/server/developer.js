import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { NO_LOCKS, PREVIEW_COOKIE, visitorLocks } from "@/lib/developer";
import { currentAdmin } from "./admin-auth";
import { getDeveloper } from "./developer-state";

/**
 * Cara penampil ini melihat website saat mode developer aktif. operator = sesi /admin yang sah,
 * preview = operator sedang memakai ?pratinjau=pengunjung, locks = kunci yang berlaku untuknya
 * (operator tanpa pratinjau tidak terkunci). Dihitung sekali per permintaan.
 */
export const developerView = cache(async () => {
  const developer = await getDeveloper();
  if (!developer.enabled) return { developer, operator: false, preview: false, locks: NO_LOCKS };
  const operator = Boolean(await currentAdmin());
  const preview = operator && (await cookies()).has(PREVIEW_COOKIE);
  return { developer, operator, preview, locks: visitorLocks(developer, operator && !preview) };
});
