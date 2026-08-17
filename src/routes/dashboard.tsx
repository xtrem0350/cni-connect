import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import searchImage from "@/assets/images/search.jpg";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { DocumentCard } from "@/components/DocumentCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Retrouve CNI 2026" },
      { name: "description", content: "Suivez vos déclarations, vos matchs et votre sécurité." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ phone: string | null; auth_code: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;

    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("phone, auth_code")
        .eq("id", user.id)
        .maybeSingle();

      setProfile(data ?? null);
    })();
  }, [user]);

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl bg-primary-soft p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-primary">Bonjour, {profile?.phone ?? "utilisateur"}</p>
            <h1 className="text-2xl font-bold">Tableau de bord</h1>
          </div>
          <Button asChild>
            <Link to="/declarer">
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              Nouvelle déclaration
            </Link>
          </Button>
        </header>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm text-muted-foreground">Bonjour,</p>
          <p className="text-xl font-bold">{profile?.phone ?? "--"}</p>
          <p className="text-sm text-muted-foreground">
            Code: <span className="font-mono">{profile?.auth_code ?? "--"}</span>
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="surface-card p-4">
            <p className="text-sm text-muted-foreground">Déclarations actives</p>
            <p className="mt-2 text-3xl font-bold text-primary">03</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-sm text-muted-foreground">Matchs en cours</p>
            <p className="mt-2 text-3xl font-bold text-primary">01</p>
          </div>
          <div className="surface-card p-4">
            <p className="text-sm text-muted-foreground">Mise en relation</p>
            <p className="mt-2 text-3xl font-bold text-primary">02</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Mes dernières déclarations</h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <img src={searchImage} alt="Recherche de correspondance" className="h-40 w-full object-cover" />
            </div>
            <DocumentCard title="CNI perdue" status="actif" location="Yopougon" date="12 août 2026" />
            <DocumentCard title="Passeport trouvé" status="matché" location="Abidjan Plateau" date="11 août 2026" />
          </div>

          <div className="surface-card p-4">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" aria-hidden />
              <h2 className="font-semibold">Vérification de sécurité</h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Les numéros sont protégés et les codes de validation sont requis avant ouverture du chat.
            </p>
            <Link to="/securite" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Voir les règles de sécurité
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
