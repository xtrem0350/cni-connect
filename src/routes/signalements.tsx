import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { HeroBanner } from "@/components/HeroBanner";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/signalements")({
  head: () => ({
    meta: [
      { title: "Signalements — Retrouve CNI 2026" },
      { name: "description", content: "Modération des signalements pour l'équipe administrative." },
    ],
  }),
  component: SignalementsPage,
});

function SignalementsPage() {
  const { user, isAdmin } = useAuth();

  if (!user || !isAdmin) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md py-12 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-destructive" aria-hidden />
          <h2 className="mt-4 text-xl font-bold">⛔ Accès réservé aux Admin</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Vous devez disposer des droits d’administration pour consulter les signalements.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <HeroBanner title="Signalements" subtitle="Modération des signalements" />
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Modération</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Aucun signalement pour le moment. Les cas frauduleux apparaîtront ici.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
