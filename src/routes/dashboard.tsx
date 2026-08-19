import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, MessageSquareText, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { HeroBanner } from "@/components/HeroBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type DeclarationSummary = {
  id: string;
  type: "perdu" | "trouve";
  type_document?: string;
  statut?: string;
  lieu_perte_trouvaille?: string;
  date_naissance?: string;
};

function DashboardPage() {
  const { user, userProfile } = useAuth();
  const [declarations, setDeclarations] = useState<DeclarationSummary[]>([]);
  const [matchCount, setMatchCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    void (async () => {
      const { data: declarationData } = await supabase
        .from("declarations")
        .select("id, type, type_document, statut, lieu_perte_trouvaille, date_naissance")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      setDeclarations((declarationData as DeclarationSummary[] | null) ?? []);

      const { data: allUserDeclarations } = await supabase.from("declarations").select("id").eq("user_id", user.id);
      const declarationIds = (allUserDeclarations ?? []).map(({ id }) => id);
      if (declarationIds.length === 0) {
        setMatchCount(0);
        return;
      }

      const { data: matchData } = await supabase
        .from("matchs")
        .select("id, declaration_perdu_id, declaration_trouve_id")
        .or(`declaration_perdu_id.in.(${declarationIds.join(",")}),declaration_trouve_id.in.(${declarationIds.join(",")})`);
      const userMatchCount = (matchData ?? []).filter((match) => {
        const declarationIds = [match.declaration_perdu_id, match.declaration_trouve_id];
        return declarationIds.some((id) => id !== undefined && id !== null);
      }).length;

      setMatchCount(userMatchCount);
    })();
  }, [user]);

  const userPhone = userProfile?.phone ?? userProfile?.telephone ?? user?.phone ?? "Numéro non renseigné";
  const userCode = userProfile?.auth_code ?? "Code non renseigné";
  const greeting = new Date().getHours() < 18 ? "Bonjour" : "Bonsoir";

  const activeDeclarations = useMemo(
    () => declarations.filter((item) => item.statut === "actif" || !item.statut).length,
    [declarations],
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <HeroBanner title="Tableau de bord" subtitle="Gérez vos déclarations" />

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">
            {greeting}, {userPhone}
          </h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Code : <span className="font-mono text-base text-foreground">{userCode}</span>
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Déclarations en cours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{activeDeclarations}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Matchs trouvés</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{matchCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">0</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/declarer?type=perdu">📄 Déclarer une perte</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/declarer?type=trouve">📄 Déclarer une trouvaille</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" aria-hidden />
                Mes déclarations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{activeDeclarations}</p>
              <p className="mt-2 text-sm text-muted-foreground">déclarations actives</p>
              <Button asChild className="mt-4 w-full" variant="outline">
                <Link to="/mes-declarations">Voir la liste</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquareText className="h-5 w-5 text-primary" aria-hidden />
                Mes matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{matchCount}</p>
              <p className="mt-2 text-sm text-muted-foreground">correspondances détectées</p>
              <Link to="/chat" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Ouvrir le chat
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Déclarations récentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {declarations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune déclaration pour le moment.</p>
              ) : (
                declarations.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
                    <div>
                      <p className="font-medium">{item.type_document ?? "Document"}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.type === "perdu" ? "Perdu" : "Trouvé"} · {item.lieu_perte_trouvaille ?? "Lieu non renseigné"}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-primary">
                      {item.statut ?? "actif"}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Les numéros de document sont protégés et les codes de validation restent requis avant tout échange.
              </p>
              <Link to="/securite" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Lire la politique
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
