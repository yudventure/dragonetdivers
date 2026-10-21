import { gallery } from "@/content/gallery";
import { socialLinks } from "@/lib/site";
import { parseVideoUrl } from "@/lib/video-embed";
import GalleryGrid from "./GalleryGrid";
import { FacebookIcon, InstagramIcon, TikTokIcon, Wave, YouTubeIcon } from "./icons";

const SOCIAL_ICONS = { instagram: InstagramIcon, tiktok: TikTokIcon, facebook: FacebookIcon, youtube: YouTubeIcon };

// Galeri foto dan video di bawah peta titik selam. Isinya di src/content/gallery.js; tautan video
// YouTube, Shorts, TikTok, Instagram, dan Facebook dibaca saat build (src/lib/video-embed.js), tautan
// yang tidak dikenali dilewati dengan peringatan di log build.
export default function Gallery() {
  const items = gallery.flatMap((item) => {
    if (item.type !== "embed") return [item];
    const video = parseVideoUrl(item.url);
    if (!video) {
      console.warn(`Galeri: tautan video tidak dikenali, dilewati (${item.url}).`);
      return [];
    }
    return [{ ...item, video, size: item.size ?? (video.vertical ? "tall" : "wide") }];
  });
  if (items.length === 0) return null;
  const illustrations = items.some((item) => item.illustration);
  const socials = socialLinks();

  return (
    <section id="gallery" aria-labelledby="gallery-title" className="scroll-mt-24 bg-white">
      <div className="gutter mx-auto grid max-w-[1200px] gap-8 pt-16 md:pt-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="grid content-start gap-3">
            <p className="eyebrow">Gallery</p>
            <h2 id="gallery-title" className="text-[1.75rem] leading-[1.15] text-abyss sm:text-[2.125rem]">
              Moments from the Dampier Strait
            </h2>
            <Wave />
          </div>
          {socials.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate">Follow our dives</span>
              {socials.map(({ id, label, href }) => {
                const Icon = SOCIAL_ICONS[id];
                return (
                  <a
                    key={id}
                    href={href}
                    target="_blank"
                    rel="noopener"
                    aria-label={label}
                    title={label}
                    className="grid size-10 place-items-center rounded-full border-[1.5px] border-teal text-teal transition-colors duration-200 ease-brand hover:bg-teal-soft"
                  >
                    <Icon className="size-[18px]" />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <GalleryGrid items={items} />

        {illustrations && (
          <p className="text-sm text-slate">
            The images and clips here are AI illustrations for now. Our own photos and videos from the Dampier Strait are coming soon.
          </p>
        )}
      </div>
    </section>
  );
}
