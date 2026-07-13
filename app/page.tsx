import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { WaitlistModal } from "@/components/site/waitlist-modal";
import { Backdrop } from "@/components/landing/backdrop";
import { BoltField } from "@/components/landing/bolt-field";
import { Hero } from "@/components/landing/hero";
import { DemoVideo } from "@/components/landing/demo-video";
import { HowItWorks, Features, FinalCta } from "@/components/landing/sections";
import { Faq } from "@/components/landing/faq";

/* One straight funnel, one goal (the waitlist):
 * hook → see it → how it works → what you get → objections → close.
 * Every chapter ends pointing at the next; every CTA points at #waitlist.
 * The hero's world IS the page: one continuous Dark-Amethyst backdrop with
 * electric grid + brand-color glows running from first section to last. */
export default function Home() {
  return (
    <>
      {/* landing-only: the canvas behind overscroll must be amethyst too */}
      <style>{`html, body { background: var(--volt-600); }`}</style>
      <Nav />
      <Backdrop />
      <div className="relative">
        {/* yellow bolts scattered across the whole page, behind the content */}
        <BoltField />
        <div className="relative z-10">
          <main>
            <Hero />
            <DemoVideo />
            <HowItWorks />
            <Features />
            <Faq />
            <FinalCta />
          </main>
          <Footer />
        </div>
      </div>
      <WaitlistModal />
    </>
  );
}
