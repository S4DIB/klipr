import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth/session";
import { Logo } from "@/components/ui/logo";
import { OnboardingForm } from "@/components/app/onboarding-form";

export const metadata: Metadata = { title: "Set up your profile" };

export default async function OnboardingPage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.profileCompleted) redirect("/marketplace");

  return (
    <main className="mx-auto w-full max-w-md px-6 py-16">
      <div className="mb-8 flex justify-center">
        <Logo className="text-xl" />
      </div>
      <div className="card-shadow rounded-2xl border border-line bg-white p-8">
        <p className="eyebrow mb-2">One last step</p>
        <h1 className="display text-3xl text-text-hi">Set up your profile</h1>
        <p className="mt-2 text-text-mid">
          You can&rsquo;t browse campaigns until this is done — it&rsquo;s how we
          pay you.
        </p>
        <div className="mt-8">
          <OnboardingForm defaultName={user.displayName} />
        </div>
      </div>
    </main>
  );
}
