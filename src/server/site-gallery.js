import "server-only";
import { activeGallery } from "@/lib/modules/site";
import { clipInfo } from "./clips";
import { isDatabaseConfigured } from "./db-config.js";
import { FALLBACK_BLUR, imageInfo } from "./media";
import { listRecords } from "./records";

/**
 * Galeri beranda dari /admin/situs, atau null bila belum ada item aktif (atau database belum bisa
 * dibaca, mis. saat build) sehingga beranda memakai galeri bawaan src/content/gallery.js.
 */
export async function siteGallery() {
  if (!isDatabaseConfigured()) return null;
  try {
    const records = (await listRecords("gallery")).filter((r) => r.active);
    if (!records.length) return null;
    const info = await imageInfo(records.filter((r) => r.type === "photo").map((r) => r.mediaId));
    // Klip video yang lengkap (yang hilang atau belum selesai diunggah dilewati, petaknya memakai tautannya).
    const clips = await clipInfo(records.filter((r) => r.type === "embed" && r.clipId).map((r) => r.clipId)).catch(() => ({}));
    const withSize = records
      .filter((r) => r.type !== "photo" || info[r.mediaId])
      .map((r) => {
        if (r.type === "photo") return { ...r, ...info[r.mediaId], blur: info[r.mediaId].blur || FALLBACK_BLUR };
        const clip = clips[r.clipId];
        return clip ? { ...r, clipWidth: clip.width, clipHeight: clip.height } : { ...r, clipId: "" };
      });
    return withSize.length ? activeGallery(withSize) : null;
  } catch (error) {
    console.error(`[galeri] ${error.code ?? error.message}`);
    return null;
  }
}
