import { Logo } from "@/components/ui/logo";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="shell flex flex-col gap-8 py-14 md:flex-row md:items-end md:justify-between">
        <div>
          <Logo className="text-text-hi" />
          {/* one brand line only (spec §9) — "Klipr" is the wordmark above */}
          <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-text-low">
            The platform for clipping content.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-10 gap-y-3 text-sm text-text-mid">
          <a href="#demo" className="transition-colors hover:text-volt-600">
            Watch the demo
          </a>
          <a href="#how" className="transition-colors hover:text-volt-600">
            How it works
          </a>
          <a href="#features" className="transition-colors hover:text-volt-600">
            Features
          </a>
          <a href="#brands" className="transition-colors hover:text-volt-600">
            For brands
          </a>
          <a href="#faq" className="transition-colors hover:text-volt-600">
            FAQ
          </a>
          <a href="#waitlist" className="transition-colors hover:text-volt-600">
            Join the waitlist
          </a>
        </div>
      </div>
      <div className="shell flex flex-col gap-2 border-t border-line py-6 text-xs text-text-low sm:flex-row sm:items-center sm:justify-between">
        {/* clipper-facing copy, not the brand line (spec §9) */}
        <p>Get paid per view.</p>
        <p className="font-mono">© 2026</p>
      </div>
    </footer>
  );
}
