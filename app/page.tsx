import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { routeFor, accessAllowed } from "@/lib/auth/guards";
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
export default async function Home() {
  // Logged-in users get the product, not the marketing page — straight to their
  // app home (or onboarding if they haven't finished setup). Anonymous visitors
  // (most landing traffic) skip the auth chain entirely — only pay it if an auth
  // cookie is present.
  const jar = await cookies();
  const mightBeLoggedIn = jar
    .getAll()
    .some((c) => (c.name.startsWith("sb-") && c.name.includes("-auth-token")) || c.name === "klipr_uid");
  if (mightBeLoggedIn) {
    const user = await currentUser();
    if (user && accessAllowed(user)) redirect(routeFor(user));
  }

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
