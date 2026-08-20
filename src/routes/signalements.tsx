import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { HeroBanner } from "@/components/HeroBanner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase";

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
  const [signalements, setSignalements] = useState<Array<{
    id: string;
    raison: string;
    details: string | null;
    statut: string;
    created_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!user || !isAdmin) return;

    void (async () => {
      const { data, error } = await supabase
        .from("signalements")
        .select("id, raison, details, statut, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Impossible de charger les signalements");
      } else {
        setSignalements(data ?? []);
      }
      setLoading(false);
    })();
  }, [isAdmin, user]);

  return (
    <AppShell>
      <div className="space-y-5">
        <HeroBanner title="Signalements" subtitle="Modération des signalements" />
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Modération</h1>
          {loading ? <p className="mt-2 text-sm text-muted-foreground">Chargement...</p> : null}
          {!loading && signalements.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Aucun signalement pour le moment.</p>
          ) : null}
          <div className="mt-4 space-y-3">
            {signalements.map((signalement) => (
              <article key={signalement.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold">{signalement.raison}</h2>
                  <span className="text-xs uppercase text-muted-foreground">{signalement.statut}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{signalement.details || "Aucun détail"}</p>
                <time className="mt-2 block text-xs text-muted-foreground">
                  {new Date(signalement.created_at).toLocaleString("fr-FR")}
                </time>
              </article>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
