import { Logo } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="shell flex flex-col gap-8 py-14 md:flex-row md:items-end md:justify-between">
        <div>
          <Logo className="text-yellow" />
          {/* one brand line only (spec §9) — "Klipr" is the wordmark above */}
          <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-white/50">
            The platform for clipping content.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-10 gap-y-3 text-sm text-white/65">
          <a href="#demo" className="transition-colors hover:text-yellow">
            Watch the demo
          </a>
          <a href="#how" className="transition-colors hover:text-yellow">
            How it works
          </a>
          <a href="#features" className="transition-colors hover:text-yellow">
            Features
          </a>
          <a href="#brands" className="transition-colors hover:text-yellow">
            For brands
          </a>
          <a href="#faq" className="transition-colors hover:text-yellow">
            FAQ
          </a>
          <a href="#waitlist" className="transition-colors hover:text-yellow">
            Join the waitlist
          </a>
        </div>
      </div>
      <div className="shell flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
        {/* clipper-facing copy, not the brand line (spec §9) */}
        <p>Get paid per view.</p>
        <p className="font-mono">© 2026</p>
      </div>
    </footer>
  );
}
