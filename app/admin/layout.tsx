import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/auth/session";
import { signOut } from "@/lib/auth/actions";
import { Logo } from "@/components/ui/logo";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/marketplace");

  return (
    <div className="min-h-[100svh] bg-ink-900">
      <header className="sticky top-0 z-40 border-b border-line bg-white/80 backdrop-blur-md">
        <div className="shell flex h-16 items-center justify-between">
          <Link href="/marketplace" className="flex items-center gap-2">
            <Logo />
            <span className="rounded-md bg-volt-500/10 px-2 py-0.5 text-xs font-semibold text-volt-600">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/marketplace" className="text-sm text-text-mid hover:text-text-hi">
              Exit to app
            </Link>
            <form action={signOut}>
              <button className="text-sm text-text-mid hover:text-text-hi">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="shell py-10">{children}</main>
    </div>
  );
}
