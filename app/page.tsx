import { Nav } from "@/components/site/nav";
import { Footer } from "@/components/site/footer";
import { WaitlistModal } from "@/components/site/waitlist-modal";
import { Backdrop } from "@/components/landing/backdrop";
import { BoltField } from "@/components/landing/bolt-field";
import { Hero } from "@/components/landing/hero";
import { DemoVideo } from "@/components/landing/demo-video";
import { HowItWorks, Features, ForBrands, FinalCta } from "@/components/landing/sections";
import { Faq } from "@/components/landing/faq";

/* One straight funnel, one goal (the waitlist):
 * hook → see it → how it works → what you get → objections → close.
 * Every chapter ends pointing at the next; every CTA points at #waitlist.
 * The hero's world IS the page: one continuous Klipr Glass daylight field —
 * frosted ivory over soft brand-color pools — matching the product app. */
export default function Home() {
  return (
    <>
      {/* landing-only: the canvas behind overscroll matches the product's neutral surface */}
      <style>{`html, body { background: #f4f3f7; }`}</style>
      <Nav />
      <Backdrop />
      <div className="landing-surface relative">
        {/* soft violet brand bolts scattered across the whole page, behind the content */}
        <BoltField />
        <div className="relative z-10">
          <main>
            <Hero />
            <DemoVideo />
            <HowItWorks />
            <Features />
            <ForBrands />
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
