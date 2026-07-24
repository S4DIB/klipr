import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth/session";
import { routeFor } from "@/lib/auth/guards";
import { Logo } from "@/components/ui/logo";
import { ApplyForm } from "@/components/app/apply-form";

export const metadata: Metadata = { title: "Apply" };

/**
 * The front door of the gated model. Creating an account gave a login only.
 * this application is what earns marketplace access, after a human review.
 */
export default async function ApplyPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  // Already routed elsewhere? Never show the form twice.
  if (user.access === "waitlisted") redirect("/apply/status");
  if (user.access === "active") redirect(routeFor(user));
  if (user.role === "brand" && user.profileCompleted) redirect("/brand");
  if (user.role === "admin") redirect("/admin");
  // access "none" or "declined" (declined users arrive via the reapply action)

  return (
    <div className="klipr-app relative min-h-dvh">
      <div className="field-app fixed inset-0 -z-10" aria-hidden="true" />
      <main className="mx-auto flex w-full max-w-[520px] flex-col gap-[14px] px-4 py-10">
        <Link href="/" className="text-text-hi" aria-label="Klipr home">
          <Logo className="text-[15px]" />
        </Link>

        <header>
          <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-ink-900">
            Apply to clip
          </h1>
          <p className="mt-1 text-[13.5px] leading-[1.55] text-ink-600">
            There&rsquo;s no instant account. We review every page by hand against the Clipper
            Standard: active, posting 3-5×/week, real engagement.
          </p>
        </header>

        <ApplyForm />
      </main>
    </div>
  );
}
