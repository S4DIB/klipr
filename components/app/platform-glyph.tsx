import type { Platform } from "@/lib/db/types";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
} from "@/components/ui/platform-icons";

const GLYPHS: Record<Platform, (p: { className?: string }) => React.ReactNode> = {
  tiktok: TikTokIcon,
  youtube: YouTubeIcon,
  instagram: InstagramIcon,
  facebook: FacebookIcon,
};

/** The monochrome glyph for a platform id — keyed the way the domain model is. */
export function PlatformGlyph({ platform, className }: { platform: Platform; className?: string }) {
  const Icon = GLYPHS[platform];
  return <Icon className={className} />;
}
