import { Link, useRouter } from "@tanstack/react-router";
import { FileSearch, Flag, HelpCircle, LayoutDashboard, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const publicItems = [
  { to: "/", label: "Accueil", icon: LayoutDashboard },
  { to: "/faq", label: "FAQ", icon: HelpCircle },
  { to: "/guide", label: "Guide", icon: FileSearch },
  { to: "/securite", label: "Sécurité", icon: ShieldCheck },
] as const;

const citizenItems = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/mes-declarations", label: "Mes Déclarations", icon: FileSearch },
  { to: "/declarer", label: "Déclarer", icon: FileSearch },
  { to: "/vault", label: "Coffre fort", icon: ShieldCheck },
  { to: "/statut", label: "Statistiques", icon: ShieldCheck },
  { to: "/faq", label: "FAQ", icon: HelpCircle },
  { to: "/signalement", label: "Signaler", icon: Flag },
] as const;

export function Navigation() {
  const { user, isAdmin, signOut } = useAuth();
  const router = useRouter();
  const items = user ? (isAdmin ? [...publicItems, citizenItems[0], citizenItems[3]] : [...publicItems, ...citizenItems]) : publicItems;

  return (
    <nav className="flex flex-wrap gap-2">
      {items.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          activeProps={{ className: "border-primary bg-primary-soft text-primary" }}
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </Link>
      ))}
      {user ? <Button variant="ghost" size="sm" onClick={async () => { await signOut(); router.navigate({ to: "/" }); }}>Quitter</Button> : null}
    </nav>
  );
}
