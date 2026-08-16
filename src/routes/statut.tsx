import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { SecurityBadge } from "@/components/SecurityBadge";
import { supabase } from "@/integrations/supabase";

export const Route = createFileRoute("/statut")({
  head: () => ({
    meta: [
      { title: "Statistiques en temps réel — Retrouve CNI 2026" },
      {
        name: "description",
        content:
          "Nombre de déclarations, de rapprochements et de mises en relation réussies sur Retrouve CNI, en toute transparence.",
      },
      { property: "og:title", content: "Statistiques — Retrouve CNI 2026" },
      { property: "og:description", content: "La plateforme en chiffres, mise à jour en direct." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Statut,
});

interface Stats {
  declarations: number;
  perdus: number;
  trouves: number;
  matchs: number;
  matchs_valides: number;
}

function Statut() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_stats");
      if (error) throw error;
      return data as Stats;
    },
    refetchInterval: 30_000,
  });

  const cartes = [
    { label: "Déclarations", valeur: data?.declarations },
    { label: "Documents perdus", valeur: data?.perdus },
    { label: "Documents trouvés", valeur: data?.trouves },
    { label: "Rapprochements", valeur: data?.matchs },
    { label: "Mises en relation validées", valeur: data?.matchs_valides },
  ];

  return (
    <AppShell>
      <SecurityBadge label="Chiffres publics" />
      <h1 className="mt-3 text-2xl font-bold">La plateforme en direct</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Mise à jour automatique toutes les 30 secondes. Aucune donnée personnelle n'est exposée.
      </p>

      {error && (
        <p className="mt-6 rounded-xl bg-destructive-soft p-4 text-sm text-destructive">
          Statistiques momentanément indisponibles.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cartes.map((carte) => (
          <div key={carte.label} className="surface-card p-5">
            <p className="text-sm text-muted-foreground">{carte.label}</p>
            <p className="mt-2 text-3xl font-extrabold text-primary">
              {isLoading ? "…" : (carte.valeur ?? 0)}
            </p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
