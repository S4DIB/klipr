import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { Logo } from "@/components/ui/logo";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.profileCompleted) redirect("/onboarding");

  return (
    <div className="min-h-[100svh] bg-ink-900">
      <header className="sticky top-0 z-40 border-b border-line bg-white/80 backdrop-blur-md">
        <div className="shell flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/marketplace" aria-label="Klipr">
              <Logo />
            </Link>
            <nav className="hidden items-center gap-6 sm:flex">
              <Link href="/marketplace" className="text-sm text-text-mid hover:text-text-hi">
                Campaigns
              </Link>
              <Link href="/dashboard" className="text-sm text-text-mid hover:text-text-hi">
                Dashboard
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" className="text-sm text-volt-500 hover:text-volt-600">
                  Admin
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-medium text-text-hi">
                {user.displayName}
              </span>
              <span className="block text-xs capitalize text-text-low">
                {user.role}
              </span>
            </span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-volt-500/10 text-sm font-semibold text-volt-600">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
            <form action={signOut}>
              <button className="text-sm text-text-mid hover:text-text-hi">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="shell py-10">{children}</main>
    </div>
  );
}
