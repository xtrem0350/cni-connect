import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase";

export const Route = createFileRoute("/mes-declarations")({
  head: () => ({
    meta: [
      { title: "Mes déclarations — Retrouve CNI 2026" },
      { name: "description", content: "Consultez et modifiez vos déclarations de documents." },
    ],
  }),
  component: MesDeclarationsPage,
});

type DeclarationRecord = {
  id: string;
  type: "perdu" | "trouve";
  type_document?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  date_delivrance?: string;
  lieu_perte_trouvaille?: string;
  statut?: string;
  created_at?: string;
};

function MesDeclarationsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "perdu" | "trouve">("all");
  const [declarations, setDeclarations] = useState<DeclarationRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadDeclarations = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("declarations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) {
        setDeclarations((data as DeclarationRecord[] | null) ?? []);
      }
      setLoading(false);
    };

    void loadDeclarations();
  }, [user]);

  const filteredDeclarations = useMemo(() => {
    if (filter === "all") return declarations;
    return declarations.filter((item) => item.type === filter);
  }, [declarations, filter]);

  return (
    <AppShell>
      <div className="space-y-5">
        <header>
          <h1 className="text-2xl font-bold">Mes déclarations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulter, filtrer et mettre à jour vos déclarations.
          </p>
        </header>

        <Tabs value={filter} onValueChange={(value) => setFilter(value as "all" | "perdu" | "trouve")} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">Tout</TabsTrigger>
            <TabsTrigger value="perdu">Perdu</TabsTrigger>
            <TabsTrigger value="trouve">Trouvé</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Chargement de vos déclarations…</p>
            ) : filteredDeclarations.length === 0 ? (
              <Card className="md:col-span-2 xl:col-span-3">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Aucune déclaration trouvée pour ce filtre.
                </CardContent>
              </Card>
            ) : (
              filteredDeclarations.map((declaration) => (
                <Card key={declaration.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">
                          {declaration.type_document ?? "Document"} · {declaration.type}
                        </CardTitle>
                        <CardDescription>
                          {declaration.lieu_perte_trouvaille ?? "Lieu non renseigné"}
                        </CardDescription>
                      </div>
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-primary">
                        {declaration.statut ?? "actif"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        Date de naissance : {declaration.date_naissance ?? "-"}
                      </p>
                      <p>
                        Lieu de naissance : {declaration.lieu_naissance ?? "-"}
                      </p>
                      <p>
                        Date de délivrance : {declaration.date_delivrance ?? "-"}
                      </p>
                    </div>
                    <Button asChild className="w-full" variant="outline">
                      <Link to="/declarer" search={{ id: declaration.id }}>
                        Modifier
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
