import { Link, useRouter } from "@tanstack/react-router";
import { FileSearch, Flag, HelpCircle, LayoutDashboard, LogOut, Menu, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { SecurityBanner } from "@/components/SecurityBadge";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/declarer", label: "Déclarer", icon: FileSearch },
  { to: "/statut", label: "Statistiques", icon: ShieldCheck },
  { to: "/faq", label: "FAQ", icon: HelpCircle },
  { to: "/signalement", label: "Signaler", icon: Flag },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SecurityBanner />
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-base">
              Retrouve <span className="text-primary">CNI</span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-primary-soft text-primary" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut();
                  router.navigate({ to: "/" });
                }}
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Quitter</span>
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link to="/auth">Se connecter</Link>
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              aria-label="Ouvrir le menu"
              onClick={() => setOpen((v) => !v)}
            >
              <Menu className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-border bg-card px-4 pb-3 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2 py-3 text-sm font-medium text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-primary" }}
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Retrouve CNI 2026 — Côte d'Ivoire</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/securite" className="hover:text-foreground">
              Sécurité
            </Link>
            <Link to="/faq" className="hover:text-foreground">
              FAQ
            </Link>
            <Link to="/signalement" className="hover:text-foreground">
              Signaler un abus
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
