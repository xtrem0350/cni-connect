import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { HeroBanner } from "@/components/HeroBanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Chat sécurisé — Retrouve CNI 2026" },
      { name: "description", content: "Validez votre code de match et échangez de façon sécurisée." },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Array<{ id: string; statut: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    void (async () => {
      const { data: declarations } = await supabase.from("declarations").select("id").eq("user_id", user.id);
      const ids = (declarations ?? []).map(({ id }) => id);
      if (ids.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("matchs")
        .select("id, statut")
        .or(`declaration_perdu_id.in.(${ids.join(",")}),declaration_trouve_id.in.(${ids.join(",")})`)
        .neq("statut", "clos");
      setMatches(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-5">
        <HeroBanner title="Chat sécurisé" subtitle={`${matches.length} correspondance${matches.length > 1 ? "s" : ""} détectée${matches.length > 1 ? "s" : ""}`} />
        {loading ? <p className="text-center text-sm text-muted-foreground">Chargement...</p> : matches.length === 0 ? (
          <div className="surface-card p-6 text-center text-sm text-muted-foreground">Aucun match en cours.</div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => (
              <Card key={match.id}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-semibold">Match détecté</p>
                    <p className="text-sm text-muted-foreground">Statut : {match.statut}</p>
                  </div>
                  <Link to="/chat/$matchId" params={{ matchId: match.id }}><Button size="sm">Ouvrir</Button></Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
