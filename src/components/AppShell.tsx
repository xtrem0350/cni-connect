import { Link, useLocation, useRouter } from "@tanstack/react-router";
import {
  FileSearch,
  Flag,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  ShieldCheck,
  User,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import logoImage from "@/assets/images/logo.png";
import { SecurityBanner } from "@/components/SecurityBadge";
import { AdminModal } from "@/components/AdminModal";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, userStatus, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const isHomeRoute = location.pathname === "/";

  const navItems = useMemo(() => {
    const publicItems = [
      { to: "/", label: "Accueil", icon: LayoutDashboard },
      { to: "/faq", label: "FAQ", icon: HelpCircle },
      { to: "/guide", label: "Guide", icon: FileSearch },
      { to: "/securite", label: "Sécurité", icon: ShieldCheck },
    ];

    if (!user) return publicItems;

    if (isAdmin) {
      return [
        { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/statut", label: "Statistiques", icon: ShieldCheck },
        { to: "/signalements", label: "Signalements", icon: Flag },
      ];
    }

    return [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/declarer", label: "Déclarer", icon: FileSearch },
      { to: "/declarations", label: "Mes déclarations", icon: FileSearch },
      { to: "/chat", label: "Chat", icon: MessageSquare },
      { to: "/signalement", label: "Signaler", icon: Flag },
      { to: "/profile", label: "Profil", icon: User },
    ];
  }, [isAdmin, user, userStatus]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SecurityBanner />
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-extrabold tracking-tight">
            <img src={logoImage} alt="Retrouve CNI" className="h-9 w-9 rounded-xl object-cover" />
            <span className="text-base">
              Retrouve <span className="text-primary">CNI</span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAdminModalOpen(true)}
              className="text-muted-foreground hover:text-primary"
              title="Administration"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Admin</span>
            </Button>
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
            ) : null}
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
            {navItems.map((item) => (
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

      {!isHomeRoute ? (
        <footer className="border-t border-border bg-card/80 py-4">
          <div className="mx-auto flex w-full max-w-5xl justify-center px-4 text-center text-sm text-muted-foreground">
            <span className="md:hidden">Par Thierry Gogo &amp; Co</span>
            <span className="hidden md:inline">Développé par Thierry Gogo &amp; Co</span>
          </div>
        </footer>
      ) : null}

      <AdminModal open={adminModalOpen} onOpenChange={setAdminModalOpen} />
    </div>
  );
}
