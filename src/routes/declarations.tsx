import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppShell } from "@/components/AppShell";
import { DocumentCard } from "@/components/DocumentCard";

export const Route = createFileRoute("/declarations")({
  head: () => ({
    meta: [
      { title: "Mes déclarations — Retrouve CNI 2026" },
      { name: "description", content: "Suivez vos déclarations et leur état." },
    ],
  }),
  component: DeclarationsPage,
});

function DeclarationsPage() {
  return (
    <AppShell>
      <div className="space-y-5">
        <header>
          <h1 className="text-2xl font-bold">Mes déclarations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Consultez le statut des documents déclarés.</p>
        </header>

        <Tabs defaultValue="actif" className="space-y-4">
          <TabsList>
            <TabsTrigger value="actif">Actif</TabsTrigger>
            <TabsTrigger value="matché">Matché</TabsTrigger>
            <TabsTrigger value="restitué">Restitué</TabsTrigger>
            <TabsTrigger value="inactif">Inactif</TabsTrigger>
          </TabsList>

          <TabsContent value="actif" className="grid gap-4 md:grid-cols-2">
            <DocumentCard title="CNI perdue" status="actif" location="Yopougon" date="12 août 2026" />
            <DocumentCard title="Passeport retrouvé" status="actif" location="San Pedro" date="09 août 2026" />
          </TabsContent>

          <TabsContent value="matché" className="grid gap-4 md:grid-cols-2">
            <DocumentCard title="Carte d'identité trouvée" status="matché" location="Abidjan" date="08 août 2026" />
          </TabsContent>

          <TabsContent value="restitué" className="grid gap-4 md:grid-cols-2">
            <DocumentCard title="Permis de conduire remis" status="restitué" location="Marcory" date="07 août 2026" />
          </TabsContent>

          <TabsContent value="inactif" className="grid gap-4 md:grid-cols-2">
            <DocumentCard title="Ancienne declaration" status="inactif" location="Bingerville" date="01 août 2026" />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
