import { Lock, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function SecurityBanner() {
  return (
    <Link
      to="/securite"
      className="flex items-center justify-center gap-2 bg-primary-soft px-4 py-2 text-center text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
    >
      <Lock className="h-3.5 w-3.5" aria-hidden />
      Sécurisé — aucun numéro de document stocké en clair
    </Link>
  );
}

export function SecurityBadge({ label = "Sécurisé" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-semibold text-success">
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}
